'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, ImageIcon, Video, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useWalletStore } from '@/store/wallet'
import { useToast } from '@/components/ui/use-toast'


interface CloudinaryResult {
  event: string
  info: {
    secure_url: string
  }
}

export default function CreatePostPage() {
  const router = useRouter()
  const { isConnected, address, userId } = useWalletStore()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet first"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      formData.append('userId', userId)
      formData.append('address', address)
      if (preview) {
        formData.append('imageUrl', preview)
        formData.append('mediaType', mediaType || '')
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to create post"
        })
        throw new Error('Failed to create post')
      }
      toast({
        title: "Success",
        description: "Post created successfully"
      })
      router.push('/')
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while creating the post"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-950">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-6">Create Post</h1>
                </div>

                <div>
                  <Input
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-gray-900/50 border-gray-700 text-white"
                    required
                  />
                </div>

                <div>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] bg-gray-900/50 border-gray-700 text-white"
                    required
                  />
                </div>

                <div>
                  <Tabs defaultValue="image">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="image">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Image
                      </TabsTrigger>
                      <TabsTrigger value="video">
                        <Video className="mr-2 h-4 w-4" />
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
                            clientAllowedFormats: ["image"],
                            maxFileSize: 10000000,
                          }}
                          onSuccess={(result: CloudinaryResult) => {
                            if (result.event === "success") {
                              setPreview(result.info.secure_url)
                              setMediaType('image')
                            }
                          }}
                        >
                          {({ open }) => (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-[200px] border-dashed border-2 border-gray-700 hover:border-gray-600 bg-gray-900/50"
                              onClick={() => open?.()}
                            >
                              <div className="flex flex-col items-center justify-center text-gray-400">
                                <ImageIcon className="h-8 w-8 mb-2" />
                                <span>Upload Image</span>
                                <span className="text-sm text-gray-500 mt-1">
                                  Max file size: 10MB
                                </span>
                              </div>
                            </Button>
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
                            clientAllowedFormats: ["mp4", "mov"],
                            maxFileSize: 100000000,
                          }}
                          onSuccess={(result: CloudinaryResult) => {
                            if (result.event === "success") {
                              setPreview(result.info.secure_url)
                              setMediaType('video')
                            }
                          }}
                        >
                          {({ open }) => (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-[200px] border-dashed border-2 border-gray-700 hover:border-gray-600 bg-gray-900/50"
                              onClick={() => open?.()}
                            >
                              <div className="flex flex-col items-center justify-center text-gray-400">
                                <Video className="h-8 w-8 mb-2" />
                                <span>Upload Video</span>
                                <span className="text-sm text-gray-500 mt-1">
                                  Max file size: 100MB
                                </span>
                              </div>
                            </Button>
                          )}
                        </CldUploadWidget>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Creating Post...</span>
                    </div>
                  ) : (
                    'Create Post'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
