import { exec, execSync, spawn } from "child_process"
import path from "path"

const projectDir = path.join(__dirname, "project-1")

let devProcess: ReturnType<typeof spawn> | null = null

const runCommandInProject = (command: string) => {
  console.log(`Running command: ${command}`)
  exec(command, { cwd: projectDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`)
      return
    }
    console.log(`Stdout: ${stdout}`)
  })
}

const startDevServer = () => {
  if (devProcess) stopDevServer()
  devProcess = spawn("npm", ["run", "dev"], {
    cwd: projectDir,
    stdio: "inherit",
  })
  console.log("Development server started...")
}

const stopDevServer = () => {
  if (devProcess) {
    devProcess.kill("SIGINT")
    console.log("Development server stopped.")
  } else {
    console.log("No development server is running.")
  }
}

// Example usage:
runCommandInProject("npm install")
startDevServer()

// Stop the server after 10 seconds for demonstration purposes
setTimeout(stopDevServer, 5000)
