'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImagePlus, Loader2, X, Film } from 'lucide-react'
import Image from 'next/image'
import { useWalletStore } from '@/store/wallet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from '@/components/navbar'

interface MediaUpload {
  type: 'image' | 'video'
  url: string
  previewUrl?: string
}

export default function CreatePostPage() {
  const { isConnected, userId } = useWalletStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          mediaUrl: preview,
          mediaType,
          userId: userId
        }),
      })

      if (!response.ok) throw new Error('Failed to create post')

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="h-[calc(100vh-4rem)] overflow-auto">
        <div className="flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md mx-auto bg-black/30 backdrop-blur-xl p-8 rounded-xl border border-gray-800">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400">
              Please connect your wallet to create a post and join our community
            </p>
            <Button 
              onClick={() => window.kasware?.requestAccounts()}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 w-full"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-auto">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-gray-800 bg-black/30 backdrop-blur-xl shadow-xl">
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
                Create a New Post
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-200">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a catchy title"
                    className="w-full bg-black/50 border-gray-800 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-200">
                    Content
                  </label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write something interesting..."
                    className="w-full min-h-[120px] bg-black/50 border-gray-800 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Media
                  </label>
                  <Tabs defaultValue="image" className="w-full">
                    <TabsList className="w-full bg-black/50 border border-gray-800">
                      <TabsTrigger value="image" className="w-full data-[state=active]:bg-purple-500/20">
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Image
                      </TabsTrigger>
                      <TabsTrigger value="video" className="w-full data-[state=active]:bg-purple-500/20">
                        <Film className="mr-2 h-4 w-4" />
                        Video
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="image" className="mt-4">
                      {preview && mediaType === 'image' ? (
                        <div className="relative w-full h-[400px] overflow-hidden rounded-lg border border-gray-800 mb-4">
                          <Image
                            src={preview}
                            alt="Post preview"
                            fill
                            className="object-contain"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70"
                            onClick={() => setPreview(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <CldUploadWidget
                          uploadPreset="drones"
                          options={{
                            maxFiles: 1,
                            resourceType: "image",
                            clientAllowedFormats: ["jpg", "jpeg", "png", "gif"],
                            maxFileSize: 10000000,
                            sources: ["local", "url", "camera"],
                            styles: {
                              palette: {
                                window: "#000000",
                                sourceBg: "#000000",
                                windowBorder: "#474747",
                                tabIcon: "#FFFFFF",
                                inactiveTabIcon: "#8E8E8E",
                                menuIcons: "#CCE8FF",
                                link: "#FFFFFF",
                                action: "#8F5DA6",
                                inProgress: "#8F5DA6",
                                complete: "#8F5DA6",
                                error: "#EA2727",
                                textDark: "#000000",
                                textLight: "#FFFFFF"
                              }
                            }
                          }}
                          onSuccess={(result: any) => {
                            if (result.event === "success") {
                              setPreview(result.info.secure_url)
                              setMediaType('image')
                            }
                          }}
                        >
                          {({ open }) => (
                            <button
                              type="button"
                              onClick={() => open()}
                              className="w-full rounded-lg border-2 border-dashed border-gray-800 p-8 transition-all duration-200 hover:border-purple-500/50 hover:bg-purple-500/5"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <ImagePlus className="h-8 w-8 text-gray-400" />
                                <div className="text-center">
                                  <p className="text-sm font-medium text-gray-300">
                                    Click to upload an image
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    PNG, JPG, GIF up to 10MB
                                  </p>
                                </div>
                              </div>
                            </button>
                          )}
                        </CldUploadWidget>
                      )}
                    </TabsContent>
                    <TabsContent value="video" className="mt-4">
                      {preview && mediaType === 'video' ? (
                        <div className="relative w-full h-[400px] overflow-hidden rounded-lg border border-gray-800 mb-4">
                          <video
                            src={preview}
                            className="w-full h-full object-contain"
                            controls
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70"
                            onClick={() => setPreview(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <CldUploadWidget
                          uploadPreset="drones"
                          options={{
                            maxFiles: 1,
                            resourceType: "video",
                            clientAllowedFormats: ["mp4", "mov", "webm"],
                            maxFileSize: 100000000,
                            sources: ["local", "url", "camera"],
                            styles: {
                              palette: {
                                window: "#000000",
                                sourceBg: "#000000",
                                windowBorder: "#474747",
                                tabIcon: "#FFFFFF",
                                inactiveTabIcon: "#8E8E8E",
                                menuIcons: "#CCE8FF",
                                link: "#FFFFFF",
                                action: "#8F5DA6",
                                inProgress: "#8F5DA6",
                                complete: "#8F5DA6",
                                error: "#EA2727",
                                textDark: "#000000",
                                textLight: "#FFFFFF"
                              }
                            }
                          }}
                          onSuccess={(result: any) => {
                            if (result.event === "success") {
                              setPreview(result.info.secure_url)
                              setMediaType('video')
                            }
                          }}
                        >
                          {({ open }) => (
                            <button
                              type="button"
                              onClick={() => open()}
                              className="w-full rounded-lg border-2 border-dashed border-gray-800 p-8 transition-all duration-200 hover:border-purple-500/50 hover:bg-purple-500/5"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <Film className="h-8 w-8 text-gray-400" />
                                <div className="text-center">
                                  <p className="text-sm font-medium text-gray-300">
                                    Click to upload a video
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    MP4, MOV, WEBM up to 100MB
                                  </p>
                                </div>
                              </div>
                            </button>
                          )}
                        </CldUploadWidget>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Creating Post...</span>
                    </div>
                  ) : (
                    'Create Post'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
