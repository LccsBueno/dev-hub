export function dockerContainerName(id: string): string {
  return `pm-${id}`
}

export function dockerRunCommand(projectPath: string, id: string): string {
  const name = dockerContainerName(id)
  return `docker build -t ${name} "${projectPath}" && docker run --rm --name ${name} ${name}`
}
