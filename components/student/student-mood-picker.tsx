'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStudentMood, type StudentMood } from '@/components/student/student-mood-theme'

export function StudentMoodPicker({ showPreferences = false }: { showPreferences?: boolean }) {
  const { mood, themes, setMood, preferences, setPreferences, resetPreferences } = useStudentMood()

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">How is your mood today?</h2>
        <p className="text-sm text-muted-foreground">
          Pick a mood and the student app colours will change. Each mood has light and dark versions.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-3">
        {themes.map((theme) => {
          const active = mood === theme.mood
          return (
            <Button
              key={theme.mood}
              type="button"
              variant={active ? 'default' : 'outline'}
              className="h-auto min-w-0 flex-col items-start gap-1 whitespace-normal p-3 text-left"
              onClick={() => setMood(theme.mood as StudentMood)}
            >
              <span className="text-xl">{theme.emoji}</span>
              <span className="w-full break-words font-semibold">{theme.label}</span>
              <span className="w-full break-words text-xs leading-relaxed opacity-80">{theme.description}</span>
            </Button>
          )
        })}
      </div>

      {showPreferences && (
        <div className="mt-6 space-y-5 border-t border-border pt-6">
          <div className="space-y-2">
            <label htmlFor="student-wallpaper" className="text-sm font-medium text-foreground">
              Background image / wallpaper URL
            </label>
            <Input
              id="student-wallpaper"
              value={preferences.wallpaper}
              onChange={(event) => setPreferences({ wallpaper: event.target.value })}
              placeholder="https://example.com/my-wallpaper.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Use a direct image URL. Leave empty to use only the mood background.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="student-wallpaper-opacity" className="text-sm font-medium text-foreground">
                Background image opacity
              </label>
              <span className="text-sm text-muted-foreground">{Math.round(preferences.wallpaperOpacity * 100)}%</span>
            </div>
            <input
              id="student-wallpaper-opacity"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={preferences.wallpaperOpacity}
              onChange={(event) => setPreferences({ wallpaperOpacity: Number(event.target.value) })}
              className="w-full accent-primary"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">The administrator chooses the effect styles. You can turn each effect on or off for your own account.</p>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={preferences.backgroundEffect} onChange={(event) => setPreferences({ backgroundEffect: event.target.checked })} className="h-4 w-4 rounded border-border" />
                <span className="text-sm font-medium text-foreground">Background effect</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={preferences.mouseEffect} onChange={(event) => setPreferences({ mouseEffect: event.target.checked })} className="h-4 w-4 rounded border-border" />
                <span className="text-sm font-medium text-foreground">Mouse pointer effect</span>
              </label>
            </div>
            <Button type="button" variant="outline" onClick={resetPreferences}>
              Reset personal appearance
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
