import { getPost } from "@/lib/posts"
import matter from "gray-matter"
import { remark } from "remark"
import html from "remark-html"
import { notFound } from "next/navigation"

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  let content: string
  try {
    content = getPost(params.slug)
  } catch {
    notFound()
  }
  const { data, content: mdContent } = matter(content)
  const processed = await remark().use(html).process(mdContent)
  const htmlContent = processed.toString()
  return (
    <main className="prose mx-auto p-8">
      <h1>{data.title || params.slug}</h1>
      <article dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </main>
  )
}
