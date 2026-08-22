import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL

async function proxy(request: NextRequest, path: string[]) {
  const targetPath = "/api/" + path.join("/") + "/"
  const targetUrl = `${BACKEND_URL}${targetPath}${request.nextUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete("host")

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body
    init.duplex = "half"
  }

  const backendRes = await fetch(targetUrl, init)

  const responseHeaders = new Headers()
  backendRes.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") responseHeaders.set(key, value)
  })
  for (const cookie of backendRes.headers.getSetCookie?.() ?? []) {
    responseHeaders.append("set-cookie", cookie)
  }
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")

  return new NextResponse(backendRes.body, { status: backendRes.status, headers: responseHeaders })
}

type Ctx = { params: Promise<{ path: string[] }> }
export async function GET(req: NextRequest, { params }: Ctx) { return proxy(req, (await params).path) }
export async function POST(req: NextRequest, { params }: Ctx) { return proxy(req, (await params).path) }
export async function PATCH(req: NextRequest, { params }: Ctx) { return proxy(req, (await params).path) }
export async function PUT(req: NextRequest, { params }: Ctx) { return proxy(req, (await params).path) }
export async function DELETE(req: NextRequest, { params }: Ctx) { return proxy(req, (await params).path) }