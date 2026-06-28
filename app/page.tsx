'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Page = {
  id: number
  instagram_username: string
  user_id: string
  follower_count: number
  following_count: number
  total_posts: number
  avg_engagement_rate: number
  created_at: string
}

export default function Dashboard() {
  const [pages, setPages] = useState<Page[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(undefined)

  const fetchPages = useCallback(async () => {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) {
      setPages((data || []) as Page[])
    }
  }, [])

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    // @ts-ignore
    setUser(session?.user ?? null)
    if (session?.user) {
      fetchPages()
    }
  }, [fetchPages])

  // Check if user is logged in
  useEffect(() => {
    checkUser()
  }, [checkUser])

  // Add new Instagram page
  async function addPage(e) {
    e.preventDefault()
    if (!newUsername.trim()) return

    setLoading(true)
    
    // For MVP, we'll add basic data (you'll enhance this later with real Instagram data)
    const { data, error } = await supabase
      .from('pages')
      .insert([
        { 
          instagram_username: newUsername.replace('@', ''),
          user_id: user.id,
          follower_count: 0,
          following_count: 0,
          total_posts: 0,
          avg_engagement_rate: 0
        }
      ])
      .select()

    if (!error) {
      setPages([...pages, ...((data || []) as Page[])])
      setNewUsername('')
    } else {
      alert('Error adding page: ' + error.message)
    }
    
    setLoading(false)
  }

  // Delete page
  async function deletePage(id) {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id)

    if (!error) {
      setPages(pages.filter(p => p.id !== id))
    }
  }

  // Sign in (simple email auth)
  async function signInWithEmail() {
    const email = prompt('Enter your email:')
    if (!email) return

    const { error } = await supabase.auth.signInWithOtp({ email })
    
    if (!error) {
      alert('Check your email for the login link!')
    } else {
      alert('Error: ' + error.message)
    }
  }

  // Sign out
  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setPages([])
  }

  // If not logged in, show login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <h1 className="text-4xl font-bold mb-4 text-center">📊 ContentScout</h1>
          <p className="text-gray-600 mb-6 text-center">Track & analyze Instagram content like a pro</p>
          <button 
            onClick={signInWithEmail}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Sign In with Email
          </button>
        </div>
      </div>
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            📊 ContentScout
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button 
              onClick={signOut}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Total Pages</p>
              <p className="text-3xl font-bold text-purple-600">{pages.length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Followers</p>
              <p className="text-3xl font-bold text-pink-600">
                {pages.reduce((sum, p) => sum + (p.follower_count || 0), 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Avg Engagement</p>
              <p className="text-3xl font-bold text-blue-600">
                {pages.length > 0 
                  ? (pages.reduce((sum, p) => sum + (p.avg_engagement_rate || 0), 0) / pages.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Add Page Form */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Add Instagram Page</h2>
          <form onSubmit={addPage} className="flex gap-3">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter Instagram username (e.g., @natgeo)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Page'}
            </button>
          </form>
        </div>

        {/* Pages Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tracked Pages ({pages.length})</h2>
          {pages.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 text-lg">No pages yet. Add your first Instagram page above! 👆</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map(page => (
                <div key={page.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {page.instagram_username[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">@{page.instagram_username}</h3>
                        <p className="text-xs text-gray-500">
                          Added {new Date(page.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deletePage(page.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Followers:</span>
                      <span className="font-semibold">{page.follower_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posts:</span>
                      <span className="font-semibold">{page.total_posts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engagement:</span>
                      <span className="font-semibold text-purple-600">{page.avg_engagement_rate}%</span>
                    </div>
                  </div>

                  <a
                    href={`https://instagram.com/${page.instagram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block text-center bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm font-medium transition"
                  >
                    View on Instagram →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}