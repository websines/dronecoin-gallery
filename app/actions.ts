'use server'

import { db } from '@/src/db'
import { desc, eq } from 'drizzle-orm'
import { posts, users, votes, comments } from '@/src/db/schema'

export async function getPosts() {
  const results = await db
    .select({
      post: posts,
      author: users,
      votes: votes,
      comments: comments,
    })
    .from(posts)
    .leftJoin(users, eq(users.id, posts.authorId))
    .leftJoin(votes, eq(votes.postId, posts.id))
    .leftJoin(comments, eq(comments.postId, posts.id))
    .orderBy(desc(posts.createdAt))

  // Group by post and transform the data
  const postsMap = new Map()
  
  results.forEach(({ post, author, votes: vote, comments: comment }) => {
    if (!postsMap.has(post.id)) {
      postsMap.set(post.id, {
        ...post,
        author,
        votes: [],
        comments: [],
        _count: {
          votes: 0,
          comments: 0
        }
      })
    }
    
    const postData = postsMap.get(post.id)
    if (vote) {
      postData.votes.push(vote)
      postData._count.votes += vote.value
    }
    if (comment) {
      postData.comments.push(comment)
      postData._count.comments += 1
    }
  })

  return Array.from(postsMap.values())
}
