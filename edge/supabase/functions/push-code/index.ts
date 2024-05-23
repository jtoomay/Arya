import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2"

Deno.serve(async (req) => {
  const supabase = createClient(
    "https://fxkifzhsbabjspxroqkm.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4a2lmemhzYmFianNweHJvcWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY0MzUwODcsImV4cCI6MjAzMjAxMTA4N30.9TsRmSaTB2NVvmc41Une1_w3SLLtr5vyOe0bJckmcBk",
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    }
  )

  const { code, path, commitMsg, command, action } = await req.json()

  const channel = supabase.channel("aria")
  let responded = false

  channel.on("broadcast", { event: "*" }, (payload: any) => (responded = payload)).subscribe()

  const waitForResponse = async () => {
    return await new Promise((resolve) => {
      let tries = 0
      const interval = setInterval(() => {
        if (responded || tries >= 80) {
          clearInterval(interval)
          resolve(responded)
        }
        tries++
      }, 200)
    })
  }

  switch (action) {
    case "create-file":
      if (!code || !path)
        return new Response(JSON.stringify({ message: "Missing code or path!" }), {
          headers: { "Content-Type": "application/json" },
        })
      await channel.send({
        event: "create-file",
        type: "broadcast",
        payload: { code, path },
      })
      await waitForResponse()
      break
    case "delete-file":
      if (!path)
        return new Response(JSON.stringify({ message: "Missing path!" }), {
          headers: { "Content-Type": "application/json" },
        })
      await channel.send({
        event: "delete-file",
        type: "broadcast",
        payload: { path },
      })
      await waitForResponse()
      break
    case "push-file":
      if (!path)
        return new Response(JSON.stringify({ message: "Missing code, path, or commit message!" }), {
          headers: { "Content-Type": "application/json" },
        })
      await channel.send({
        event: "push-file",
        type: "broadcast",
        payload: { code, path, commitMsg },
      })
      await waitForResponse()
      break
    case "get-file":
      if (!path)
        return new Response(JSON.stringify({ message: "Missing path!" }), {
          headers: { "Content-Type": "application/json" },
        })
      await channel.send({
        event: "get-file",
        type: "broadcast",
        payload: { path },
      })
      const fileCode = await waitForResponse()
      if (!fileCode)
        return new Response(
          JSON.stringify({
            message: "Timeout while waiting for file retrieval.",
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      return new Response(JSON.stringify({ code: fileCode }), {
        headers: { "Content-Type": "application/json" },
      })
    case "get-all-files":
      await channel.send({
        event: "get-all-files",
        type: "broadcast",
        payload: {},
      })
      const files = await waitForResponse()
      if (!files)
        return new Response(
          JSON.stringify({
            message: "Timeout while waiting for all file paths.",
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      return new Response(JSON.stringify({ files }), {
        headers: { "Content-Type": "application/json" },
      })
    case "start-dev-server":
      if (!path)
        return new Response(JSON.stringify({ message: "Missing path!" }), {
          headers: { "Content-Type": "application/json" },
        })
      await channel.send({
        event: "start-dev-server",
        type: "broadcast",
        payload: { path },
      })
      await waitForResponse()
      break
    case "stop-dev-server":
      await channel.send({
        event: "stop-dev-server",
        type: "broadcast",
        payload: {},
      })
      await waitForResponse()
      break
    case "run-command":
      if (!path || !command)
        return new Response(JSON.stringify({ message: "Missing code or path!" }), {
          headers: { "Content-Type": "application/json" },
        })
      await channel.send({
        event: "run-command",
        type: "broadcast",
        payload: { command, path },
      })
      await waitForResponse()
      break
    default:
      return new Response(JSON.stringify({ message: "Invalid action specified!" }), {
        headers: { "Content-Type": "application/json" },
      })
  }

  return new Response(JSON.stringify(responded ? { ...(responded as {}), success: true } : { success: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
