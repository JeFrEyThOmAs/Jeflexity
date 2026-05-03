import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import React from 'react'


const supabase = createClient()
export default function Auth() {
    async function login(provider : "github" | "google") {
        const {data , error } = await supabase.auth.signInWithOAuth({
            provider : provider,
            options: {
              redirectTo: "http://localhost:3000/conversation"
            }
        })
        if (error) {
            alert("error while signing in")
        }
        else{
            alert("signed in")
        }
    }
  return (
    <div>
      <Button onClick={() => login("google")}>Login with Google</Button>
      <Button onClick={() => login("github")}>Login with GitHub</Button>
    </div>
  )
}
