import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js';
import {useEffect, useState} from 'react'
import { useNavigate } from 'react-router';
import axios from 'axios';
import { BACKEND_URL } from '@/lib/config';


const supabase = createClient();
export default function Dashboard() {

  const navigate = useNavigate()
  const [user , setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUser() {
      const {data , error} = await supabase.auth.getUser()
      if(data?.user){
        setUser(data.user)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    async function getExistingConversations(){
      if(user){
        const {data : {session}} = await supabase.auth.getSession()
        const jwt = session?.access_token
        const response = await axios.get(`${BACKEND_URL}/conversation`, {
          headers : {
            Authorization : jwt
          }
        })
        console.log(response.data);
      }
    }
    getExistingConversations()
    
  }, [user])
  return (
    <div>
      {!user && <Button onClick={() => navigate("/auth")} ></Button>}

      {user && <div>
        <h1>{user.email}</h1>
        <Button onClick={async() => {await supabase.auth.signOut(); setUser(null); 
          navigate("/auth")
        }}>Logout</Button></div>}
    </div>
  )
}
