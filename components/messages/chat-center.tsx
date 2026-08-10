'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, File, Forward, Megaphone, Mic, Palette, Paperclip, Reply, Search, Send, Square, X } from 'lucide-react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { storage } from '@/lib/firebase'
import { listConversationMessages, listConversations, sendChatMessage, updateStudentProfile, type ChatMessage, type ChatMessageType, type ConversationSummary } from '@/lib/backend-api'

type Mode = 'student' | 'teacher' | 'admin'
const themes = {
  blue: { page: 'bg-slate-950/5', mine: 'bg-blue-600 text-white', effect: 'radial-gradient(circle at 15% 10%, rgb(59 130 246 / 0.16), transparent 32rem), linear-gradient(rgb(59 130 246 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(59 130 246 / 0.05) 1px, transparent 1px)' },
  green: { page: 'bg-slate-950/5', mine: 'bg-emerald-600 text-white', effect: 'radial-gradient(circle at 80% 15%, rgb(16 185 129 / 0.15), transparent 32rem), linear-gradient(rgb(16 185 129 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(16 185 129 / 0.05) 1px, transparent 1px)' },
  purple: { page: 'bg-slate-950/5', mine: 'bg-violet-600 text-white', effect: 'radial-gradient(circle at 20% 20%, rgb(139 92 246 / 0.16), transparent 32rem), linear-gradient(rgb(139 92 246 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(139 92 246 / 0.05) 1px, transparent 1px)' },
  orange: { page: 'bg-slate-950/5', mine: 'bg-orange-600 text-white', effect: 'radial-gradient(circle at 80% 20%, rgb(249 115 22 / 0.15), transparent 32rem), linear-gradient(rgb(249 115 22 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(249 115 22 / 0.05) 1px, transparent 1px)' },
}

function ConversationList({ conversations, selectedUid, search, onSearch, onSelect }: {
  conversations: ConversationSummary[]
  selectedUid: string
  search: string
  onSearch: (value: string) => void
  onSelect: (uid: string) => void
}) {
  return <aside className="border-b lg:border-b-0 lg:border-r">
    <div className="border-b p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => onSearch(event.target.value)} className="pl-9" placeholder="Search students" />
      </div>
    </div>
    <div className="max-h-[620px] overflow-y-auto p-2">
      {conversations.map((conversation) => <button key={conversation.studentUid} onClick={() => onSelect(conversation.studentUid)}
        className={'flex w-full gap-3 rounded-xl p-3 text-left ' + (selectedUid === conversation.studentUid ? 'bg-primary/10' : 'hover:bg-muted')}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">{initials(conversation.studentName)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{conversation.studentName}</span>
          <span className="block text-xs text-primary">{conversation.studentId || 'Student ID pending'}</span>
          <span className="block truncate text-xs text-muted-foreground">{conversation.lastMessage || 'No messages yet'}</span>
        </span>
        <span className="text-[10px] text-muted-foreground">{messageTime(conversation.lastMessageAt)}</span>
      </button>)}
      {!conversations.length && <p className="p-6 text-center text-sm text-muted-foreground">No approved students found.</p>}
    </div>
  </aside>
}

function ChatHeader({ mode, selected, chatColor, onChatColor, onSaveChatColor }: {
  mode: Mode
  selected?: ConversationSummary
  chatColor: string
  onChatColor: (color: string) => void
  onSaveChatColor: () => void
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const name = mode === 'student' ? 'Your ICT Teacher' : selected?.studentName || 'Select a student'
  return <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background/90 p-4">
    <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">{initials(name)}</span><div><p className="font-semibold">{name}</p><p className="text-xs text-muted-foreground">{mode === 'student' ? 'Private conversation' : selected?.studentId}</p></div></div>
    {mode === 'student' && <div className="relative"><Button size="icon" variant="outline" onClick={() => setSettingsOpen((value) => !value)} title="Chat colour"><Palette className="h-4 w-4" /></Button>{settingsOpen && <div className="absolute right-0 top-11 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-xl border bg-background p-4 shadow-xl"><div className="mb-4 flex items-center justify-between"><p className="font-semibold">Chat colour</p><button onClick={() => setSettingsOpen(false)}><X className="h-4 w-4" /></button></div><p className="mb-3 text-xs text-muted-foreground">Choose the colour used for your own message bubbles.</p><div className="grid grid-cols-4 gap-2">{['#2563eb','#059669','#7c3aed','#ea580c','#db2777','#0891b2','#4f46e5','#475569'].map((color) => <button key={color} type="button" onClick={() => onChatColor(color)} className="h-10 rounded-lg border-2" style={{ backgroundColor: color, borderColor: chatColor === color ? 'white' : 'transparent' }} aria-label={'Use colour ' + color} />)}</div><label className="mt-4 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><span>Custom colour</span><input type="color" value={chatColor} onChange={(event) => onChatColor(event.target.value)} className="h-9 w-16 cursor-pointer rounded border-0 bg-transparent" /></label><Button className="mt-4 w-full" onClick={() => { onSaveChatColor(); setSettingsOpen(false) }}>Save chat colour</Button></div>}</div>}
    {mode === 'admin' && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700">Read only</span>}
  </header>
}

function MessageList({ mode, messages, currentUid, selectedUid, theme, chatColor, bottom, onReply, onForward }: {
  mode: Mode
  messages: ChatMessage[]
  currentUid?: string
  selectedUid: string
  theme: Theme
  chatColor: string
  bottom: React.RefObject<HTMLDivElement | null>
  onReply: (message: ChatMessage) => void
  onForward: (message: ChatMessage) => void
}) {
  const noticeBorders = { red: 'border-red-500', green: 'border-green-500', yellow: 'border-yellow-500', orange: 'border-orange-500' }
  return <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
    {!selectedUid && <p className="m-auto text-center text-muted-foreground">Select a student conversation.</p>}
    {selectedUid && !messages.length && <p className="m-auto text-center text-muted-foreground">No messages yet. Start the private conversation below.</p>}
    {messages.map((message, index) => {
      const previous = messages[index - 1]
      const showDate = !previous || messageDate(previous.createdAt) !== messageDate(message.createdAt)
      const mine = mode === 'admin' ? message.senderRole === 'teacher' : message.senderUid === currentUid
      const bubble = message.type === 'notice'
        ? 'border-l-4 ' + noticeBorders[message.noticeColor || 'red'] + ' bg-background text-foreground'
        : mine ? (mode === 'student' ? 'text-white rounded-br-sm' : themes[theme].mine + ' rounded-br-sm') : 'bg-background text-foreground rounded-bl-sm'
      return <div key={message.id}>
        {showDate && <p className="mx-auto mb-3 w-fit rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">{messageDate(message.createdAt)}</p>}
        <div className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
          <div className={'group max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ' + bubble} style={mine && mode === 'student' ? { backgroundColor: chatColor } : undefined}>
            <p className="mb-1 text-[10px] font-semibold opacity-70">{message.type === 'notice' ? 'PRIVATE NOTICE · ' : ''}{message.senderName}</p>
            <div className="mb-1 flex justify-end gap-2 opacity-60"><button onClick={() => onReply(message)} title="Reply"><Reply className="h-3.5 w-3.5" /></button>{mode === 'teacher' && <button onClick={() => onForward(message)} title="Forward"><Forward className="h-3.5 w-3.5" /></button>}</div>
            {message.replyToId && <div className="mb-2 rounded border-l-4 border-primary bg-black/10 p-2 text-xs"><p className="font-semibold">Reply</p><p className="truncate">{message.replyText || message.replyFileName || message.replyType}</p></div>}
            {message.text && <LinkifiedText text={message.text} />}
            {message.type === 'image' && message.fileUrl && <a href={message.fileUrl} target="_blank" rel="noreferrer"><img src={message.fileUrl} alt={message.fileName || 'Shared image'} className="mt-2 max-h-72 rounded-lg object-contain" /></a>}
            {message.type === 'audio' && message.fileUrl && <audio className="mt-2 max-w-full" controls src={message.fileUrl} />}
            {message.type === 'video' && message.fileUrl && <video className="mt-2 max-h-80 max-w-full rounded-lg" controls src={message.fileUrl} />}
            {message.type === 'file' && message.fileUrl && <a href={message.fileUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-lg border bg-background/80 p-3 text-foreground"><File className="h-5 w-5" /><span className="min-w-0 flex-1 truncate">{message.fileName || 'Document'}</span><Download className="h-4 w-4" /></a>}
            <p className="mt-1 text-right text-[10px] opacity-70">{messageTime(message.createdAt)}</p>
          </div>
        </div>
      </div>
    })}
    <div ref={bottom} />
  </div>
}

function Composer({ allowNotice, recording, sending, notice, noticeColor, replyTo, pendingFile, pendingPreview, draft, fileInput, onDraft, onNotice, onNoticeColor, onCancelReply, onCancelFile, onFile, onRecord, onSend }: {
  allowNotice: boolean
  recording: boolean
  sending: boolean
  notice: boolean
  noticeColor: 'red' | 'green' | 'yellow' | 'orange'
  replyTo: ChatMessage | null
  pendingFile: globalThis.File | null
  pendingPreview: string
  draft: string
  fileInput: React.RefObject<HTMLInputElement | null>
  onDraft: (value: string) => void
  onNotice: () => void
  onNoticeColor: (color: 'red' | 'green' | 'yellow' | 'orange') => void
  onCancelReply: () => void
  onCancelFile: () => void
  onFile: (file: globalThis.File) => void
  onRecord: () => void
  onSend: () => void
}) {
  return <footer className="border-t bg-background/95 p-3">
    {replyTo && <div className="mb-2 flex items-center justify-between rounded-lg border-l-4 border-primary bg-primary/5 p-2 text-xs"><div><p className="font-semibold">Replying to {replyTo.senderName}</p><p className="max-w-md truncate">{replyTo.text || replyTo.fileName || replyTo.type}</p></div><button onClick={onCancelReply}><X className="h-4 w-4" /></button></div>}
    {notice && <div className="mb-2 rounded-lg bg-muted p-2 text-xs"><div className="mb-2 flex items-center gap-2"><Megaphone className="h-4 w-4" />Private notice border colour</div><div className="flex gap-2">{(['red', 'green', 'yellow', 'orange'] as const).map((color) => <button key={color} onClick={() => onNoticeColor(color)} className={'rounded-full border px-3 py-1 capitalize ' + (noticeColor === color ? 'border-foreground font-semibold' : '')}>{color}</button>)}</div></div>}
    {pendingFile && <div className="relative mb-3 rounded-xl border bg-muted/40 p-3"><button className="absolute right-2 top-2 z-10 rounded-full bg-background p-1 shadow" onClick={onCancelFile}><X className="h-4 w-4" /></button>{pendingFile.type.startsWith('image/') ? <img src={pendingPreview} alt="Image preview" className="max-h-56 rounded-lg object-contain" /> : pendingFile.type.startsWith('video/') ? <video src={pendingPreview} controls className="max-h-56 w-full rounded-lg" /> : pendingFile.type.startsWith('audio/') ? <audio src={pendingPreview} controls className="w-full" /> : <div className="flex items-center gap-3 pr-8"><File className="h-8 w-8 text-primary" /><div className="min-w-0"><p className="truncate font-medium">{pendingFile.name}</p><p className="text-xs text-muted-foreground">Ready to send</p></div></div>}</div>}
    <div className="flex items-center gap-2">
      <input ref={fileInput} type="file" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) onFile(file)
        event.currentTarget.value = ''
      }} />
      <Button size="icon" variant="outline" onClick={() => fileInput.current?.click()} disabled={sending} title="Attach image or document"><Paperclip className="h-4 w-4" /></Button>
      <Button size="icon" variant={recording ? 'destructive' : 'outline'} onClick={onRecord} disabled={sending} title={recording ? 'Stop recording' : 'Record voice'}>{recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</Button>
      {allowNotice && <Button size="icon" variant={notice ? 'default' : 'outline'} onClick={onNotice} title="Private notice"><Megaphone className="h-4 w-4" /></Button>}
      <Input value={draft} onChange={(event) => onDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) onSend() }} placeholder={recording ? 'Recording voice message...' : notice ? 'Write a private notice...' : 'Write a message...'} disabled={recording || sending} />
      <Button size="icon" onClick={onSend} disabled={sending || (!draft.trim() && !pendingFile)}><Send className="h-4 w-4" /></Button>
    </div>
  </footer>
}
type Theme = keyof typeof themes
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
const messageTime = (value: string) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
const messageDate = (value: string) => value ? new Date(value).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'

function LinkifiedText({ text }: { text: string }) {
  const pattern = /((?:https?:\/\/|www\.)[^\s]+|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}|\+?\d[\d\s()\-]{6,}\d)/g
  return <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{text.split(pattern).map((part, index) => {
    if (!part) return null
    if (/^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(part)) return <a key={index} className="underline underline-offset-2" href={'mailto:' + part}>{part}</a>
    if (/^\+?\d[\d\s()\-]{6,}\d$/.test(part)) return <a key={index} className="underline underline-offset-2" href={'tel:' + part.replace(/[^+\d]/g, '')}>{part}</a>
    if (/^(?:https?:\/\/|www\.)/.test(part)) return <a key={index} className="underline underline-offset-2" href={part.startsWith('www.') ? 'https://' + part : part} target="_blank" rel="noreferrer">{part}</a>
    return <span key={index}>{part}</span>
  })}</p>
}

export function ChatCenter({ mode }: { mode: Mode }) {
  const { user, profile, refreshProfile } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedUid, setSelectedUid] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState(false)
  const [noticeColor, setNoticeColor] = useState<'red' | 'green' | 'yellow' | 'orange'>('red')
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [forwarding, setForwarding] = useState<ChatMessage | null>(null)
  const [forwardUid, setForwardUid] = useState('')
  const [pendingFile, setPendingFile] = useState<globalThis.File | null>(null)
  const [pendingPreview, setPendingPreview] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [theme, setTheme] = useState<Theme>('blue')
  const [chatColor, setChatColor] = useState('#2563eb')
  const fileInput = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const bottom = useRef<HTMLDivElement>(null)

  const refreshConversations = async () => {
    try {
      const result = await listConversations()
      setConversations(result.conversations)
      setSelectedUid((current) => current || result.conversations[0]?.studentUid || (mode === 'student' ? user?.uid || '' : ''))
    } catch (error: any) { toast.error(error.message || 'Could not load conversations') }
  }
  const refreshMessages = async (quiet = false) => {
    if (!selectedUid) return
    try {
      const result = await listConversationMessages(selectedUid)
      setMessages(result.messages)
      if (!quiet) window.setTimeout(() => bottom.current?.scrollIntoView({ behavior: 'auto' }), 0)
    } catch (error: any) { if (!quiet) toast.error(error.message || 'Could not load messages') }
  }

  useEffect(() => { void refreshConversations() }, [user?.uid])
  useEffect(() => {
    if (!selectedUid) return
    setMessages([])
    void refreshMessages()
    const timer = window.setInterval(() => { void refreshMessages(true); void refreshConversations() }, 5000)
    return () => window.clearInterval(timer)
  }, [selectedUid])
  useEffect(() => {
    if (mode !== 'student') return
    const saved = localStorage.getItem('magical-chat-theme') as Theme | null
    if (saved && themes[saved]) setTheme(saved)
    setChatColor(profile?.chatColor || localStorage.getItem('magical-chat-color') || '#2563eb')
  }, [mode, profile?.chatColor])

  const selected = conversations.find((item) => item.studentUid === selectedUid)
  const filtered = useMemo(() => conversations.filter((item) => (item.studentName + ' ' + item.studentId + ' ' + item.phone).toLowerCase().includes(search.toLowerCase())), [conversations, search])
  const chooseTheme = (value: Theme) => { setTheme(value); localStorage.setItem('magical-chat-theme', value) }
    const saveChatColor = async () => {
    if (!profile) return
    try { await updateStudentProfile({ firstName: profile.firstName || '', lastName: profile.lastName || '', parentEmail: profile.parentEmail || '', birthday: profile.birthday, profileImageUrl: profile.profileImageUrl || '', chatColor }); localStorage.setItem('magical-chat-color', chatColor); await refreshProfile(); toast.success('Chat colour saved') } catch (error: any) { toast.error(error.message || 'Could not save chat colour') }
  }
  const prepareFile = (file: globalThis.File | null) => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(file)
    setPendingPreview(file ? URL.createObjectURL(file) : '')
  }

  const send = async (attachment?: { type: ChatMessageType; fileUrl: string; fileName: string; contentType: string; text?: string }) => {
    if (!selectedUid || (!draft.trim() && !attachment)) return
    setSending(true)
    try {
      const base = attachment || { type: notice && mode === 'teacher' ? 'notice' as const : 'text' as const, text: draft.trim() }
      await sendChatMessage(selectedUid, { ...base, noticeColor, ...(replyTo ? { replyToId: replyTo.id, replyText: replyTo.text, replyType: replyTo.type, replyFileName: replyTo.fileName } : {}) })
      setDraft('')
      setNotice(false)
      setReplyTo(null)
      await Promise.all([refreshMessages(), refreshConversations()])
    } catch (error: any) { toast.error(error.message || 'Could not send message') } finally { setSending(false) }
  }
  const forwardMessage = async () => {
    if (!forwarding || !forwardUid) return
    try {
      await sendChatMessage(forwardUid, { type: forwarding.type, text: forwarding.text, fileUrl: forwarding.fileUrl, fileName: forwarding.fileName, contentType: forwarding.contentType, noticeColor: forwarding.noticeColor })
      setForwarding(null)
      setForwardUid('')
      toast.success('Message forwarded')
      await refreshConversations()
    } catch (error: any) { toast.error(error.message || 'Could not forward message') }
  }
  const upload = async (file: globalThis.File, forcedType?: ChatMessageType) => {
    if (!selectedUid) return
    setSending(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const target = ref(storage, 'private-chats/' + selectedUid + '/' + Date.now() + '-' + safeName)
      await uploadBytes(target, file, { contentType: file.type || 'application/octet-stream' })
      const fileUrl = await getDownloadURL(target)
      const type = forcedType || (file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'file')
      await send({ type, fileUrl, fileName: file.name, contentType: file.type, text: draft.trim() })
      prepareFile(null)
    } catch (error: any) {
      toast.error(error.message || 'Could not upload attachment')
      setSending(false)
    }
  }
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      chunks.current = []
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data) }
      mediaRecorder.onstop = () => {
        const audio = new globalThis.File(chunks.current, 'voice-message-' + Date.now() + '.webm', { type: mediaRecorder.mimeType || 'audio/webm' })
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        prepareFile(audio)
      }
      recorder.current = mediaRecorder
      mediaRecorder.start()
      setRecording(true)
    } catch { toast.error('Microphone access was not allowed') }
  }
  const stopRecording = () => recorder.current?.state === 'recording' && recorder.current.stop()

  const description = mode === 'admin' ? 'Read all private teacher and student conversations.' : mode === 'teacher' ? 'Select an approved student to chat or send a private notice.' : 'Your private chat with your teacher.'
  return <div className="space-y-6">
    <div><p className="text-sm font-medium text-primary">Private communication</p><h1 className="mt-1 text-3xl font-bold">Messages</h1><p className="mt-2 text-muted-foreground">{description}</p></div>
    <Card className={'grid min-h-[680px] overflow-hidden ' + (mode === 'student' ? '' : 'lg:grid-cols-[320px_1fr]')}>
      {mode !== 'student' && <ConversationList conversations={filtered} selectedUid={selectedUid} search={search} onSearch={setSearch} onSelect={setSelectedUid} />}
      <section className={'flex min-h-[600px] flex-col ' + themes[theme].page} style={{ backgroundImage: themes[theme].effect, backgroundSize: 'auto, 38px 38px, 38px 38px' }}>
        <ChatHeader mode={mode} selected={selected} chatColor={chatColor} onChatColor={setChatColor} onSaveChatColor={() => void saveChatColor()} />
        <MessageList mode={mode} messages={messages} currentUid={user?.uid} selectedUid={selectedUid} theme={theme} chatColor={chatColor} bottom={bottom} onReply={setReplyTo} onForward={setForwarding} />
        {forwarding && mode === 'teacher' && <div className="border-t bg-muted/40 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Forward message to another student</p><button onClick={() => setForwarding(null)}><X className="h-4 w-4" /></button></div><div className="flex gap-2"><select value={forwardUid} onChange={(event) => setForwardUid(event.target.value)} className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"><option value="">Choose student</option>{conversations.filter((item) => item.studentUid !== selectedUid).map((item) => <option key={item.studentUid} value={item.studentUid}>{item.studentName} · {item.studentId}</option>)}</select><Button onClick={() => void forwardMessage()} disabled={!forwardUid}>Forward</Button></div></div>}
        {mode !== 'admin' && selectedUid && <Composer allowNotice={mode === 'teacher'} recording={recording} sending={sending} notice={notice} noticeColor={noticeColor} replyTo={replyTo} pendingFile={pendingFile} pendingPreview={pendingPreview} draft={draft} fileInput={fileInput} onDraft={setDraft} onNotice={() => setNotice((value) => !value)} onNoticeColor={setNoticeColor} onCancelReply={() => setReplyTo(null)} onCancelFile={() => prepareFile(null)} onFile={prepareFile} onRecord={recording ? stopRecording : startRecording} onSend={() => pendingFile ? void upload(pendingFile) : void send()} />}
      </section>
    </Card>
  </div>
}
