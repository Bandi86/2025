import fs from "fs"
import path from "path"

export function getPost(slug: string) {
  const filePath = path.join(process.cwd(), "posts", `${slug}.md`)
  const content = fs.readFileSync(filePath, "utf8")
  return content
}

export function getAllPosts() {
  const dir = path.join(process.cwd(), "posts")
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      slug: f.replace(/\.md$/, ""),
      content: fs.readFileSync(path.join(dir, f), "utf8"),
    }))
}
