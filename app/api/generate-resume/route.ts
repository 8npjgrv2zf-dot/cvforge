import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic()

export async function POST(request: NextRequest) {
  const { prompt } = await request.json()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  return Response.json({ text })
}
