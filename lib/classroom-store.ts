'use client'

import { useEffect, useState } from 'react'
import { assignStudentToBatch, listBatches } from './backend-api'

export type ClassType = 'ICT Theory' | 'Paper Class' | 'ICT Practical' | 'Revision'
export type ResourceType = 'Recording' | 'Notice' | 'PDF' | 'Link' | 'Assignment'
export type PageBlockType = 'heading' | 'text' | 'notice' | 'link' | 'divider' | 'resource' | 'quiz' | 'assignment'
export interface PageBlock { id: string; batchId: string; type: PageBlockType; content: string; url?: string; color: string; background: string; borderColor?: string; fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl'; fontWeight: 'normal' | 'medium' | 'bold'; fontStyle?: 'normal' | 'italic'; textDecoration?: 'none' | 'underline'; align: 'left' | 'center' | 'right'; createdAt: string }

export interface Batch { id: string; name: string; institute: string; year: string; classTypes: ClassType[]; studentIds: string[] }
export interface ClassroomStudent { id: string; name: string; indexNumber: string; phone: string; email?: string; status: 'reception' | 'enrolled'; batchIds: string[]; batchId?: string }
export interface ClassroomResource { id: string; batchId: string; title: string; type: ResourceType; url?: string; details: string; publishedAt: string }
export interface AttendanceRecord { id: string; batchId: string; studentId: string; classType: ClassType; date: string; status: 'Present' | 'Absent' | 'Late' }
export interface GradeRecord { id: string; batchId: string; studentId: string; title: string; score: number; total: number; classType: ClassType }

interface ClassroomData { batches: Batch[]; students: ClassroomStudent[]; resources: ClassroomResource[]; attendance: AttendanceRecord[]; grades: GradeRecord[]; pageBlocks: PageBlock[] }

const STORAGE_KEY = 'magical-ict-classroom-v4'
export const classTypes: ClassType[] = ['ICT Theory', 'Paper Class', 'ICT Practical', 'Revision']
const seed: ClassroomData = {
  batches: [],
  students: [],
  resources: [],
  attendance: [], grades: [],
  pageBlocks: [],
}

function readData(): ClassroomData {
  if (typeof window === 'undefined') return seed
  try { const value = localStorage.getItem(STORAGE_KEY); if (!value) return seed; const saved = JSON.parse(value) as Partial<ClassroomData>; return { ...seed, ...saved, batches: [], students: [], pageBlocks: saved.pageBlocks ?? seed.pageBlocks } } catch { return seed }
}

export function useClassroomStore() {
  const [data, setData] = useState<ClassroomData>(seed)
  useEffect(() => { localStorage.removeItem('magical-ict-classroom-v2'); localStorage.removeItem('magical-ict-classroom-v3'); setData(readData()) }, [])
  useEffect(() => { listBatches().then(({ batches }) => setData((current) => ({ ...current, batches: batches.map((batch) => ({ id: batch.id, name: batch.name, institute: batch.institute || '', year: batch.year, classTypes: batch.classTypes as ClassType[], studentIds: batch.studentIds || [] })) }))).catch(() => undefined) }, [])
  const update = (recipe: (current: ClassroomData) => ClassroomData) => setData((current) => { const next = recipe(current); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next })
  const addBatch = (batch: Omit<Batch, 'id' | 'studentIds'>) => update((current) => ({ ...current, batches: [...current.batches, { ...batch, id: crypto.randomUUID(), studentIds: [] }] }))
  const addStudent = (student: Omit<ClassroomStudent, 'id' | 'status' | 'batchIds'>) => update((current) => ({ ...current, students: [...current.students, { ...student, id: crypto.randomUUID(), status: 'reception', batchIds: [] }] }))
  const enrollStudent = (studentId: string, batchId: string) => {
    const batchName = data.batches.find((batch) => batch.id === batchId)?.name
    void assignStudentToBatch(studentId, batchId, batchName).catch(() => undefined)
    update((current) => ({ ...current, students: current.students.map((student) => student.id === studentId ? { ...student, status: 'enrolled', batchIds: student.batchIds.includes(batchId) ? student.batchIds : [...student.batchIds, batchId] } : student), batches: current.batches.map((batch) => batch.id === batchId && !batch.studentIds.includes(studentId) ? { ...batch, studentIds: [...batch.studentIds, studentId] } : batch) }))
  }
  const removeStudentFromBatch = (studentId: string, batchId: string) => update((current) => ({ ...current, students: current.students.map((student) => student.id === studentId ? { ...student, batchIds: student.batchIds.filter((id) => id !== batchId), status: student.batchIds.filter((id) => id !== batchId).length ? 'enrolled' : 'reception' } : student), batches: current.batches.map((batch) => batch.id === batchId ? { ...batch, studentIds: batch.studentIds.filter((id) => id !== studentId) } : batch) }))
  const addPageBlock = (block: Omit<PageBlock, 'id' | 'createdAt'>) => update((current) => ({ ...current, pageBlocks: [...current.pageBlocks, { ...block, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }))
  const upsertPageBlock = (block: PageBlock) => update((current) => {
    const exists = current.pageBlocks.some((item) => item.id === block.id)
    return { ...current, pageBlocks: exists ? current.pageBlocks.map((item) => item.id === block.id ? block : item) : [...current.pageBlocks, block] }
  })
  const updatePageBlock = (id: string, block: Partial<PageBlock>) => update((current) => ({ ...current, pageBlocks: current.pageBlocks.map((item) => item.id === id ? { ...item, ...block } : item) }))
  const deletePageBlock = (id: string) => update((current) => ({ ...current, pageBlocks: current.pageBlocks.filter((item) => item.id !== id) }))
  const addResource = (resource: Omit<ClassroomResource, 'id' | 'publishedAt'>) => update((current) => ({ ...current, resources: [{ ...resource, id: crypto.randomUUID(), publishedAt: new Date().toLocaleDateString('en-GB') }, ...current.resources] }))
  const addAttendance = (record: Omit<AttendanceRecord, 'id'>) => update((current) => ({ ...current, attendance: [...current.attendance, { ...record, id: crypto.randomUUID() }] }))
  const addGrade = (record: Omit<GradeRecord, 'id'>) => update((current) => ({ ...current, grades: [...current.grades, { ...record, id: crypto.randomUUID() }] }))
  return { ...data, addBatch, addStudent, enrollStudent, removeStudentFromBatch, addResource, addAttendance, addGrade, addPageBlock, upsertPageBlock, updatePageBlock, deletePageBlock }
}
