import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const error = searchParams.get("error")

  let errorMessage = "An unknown authentication error occurred"

  if (error) {
    switch (error) {
      case "CredentialsSignin":
        errorMessage = "Invalid credentials"
        break
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
        errorMessage = "Error with OAuth provider"
        break
      case "EmailCreateAccount":
      case "EmailSignin":
        errorMessage = "Error with email authentication"
        break
      case "SessionRequired":
        errorMessage = "Authentication required"
        break
    }
  }

  return NextResponse.json({ error: errorMessage }, { status: 401 })
}
