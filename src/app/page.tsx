'use client';

import { invoke } from "@tauri-apps/api/core"

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ValidationAlertDialog({ open, onOpenChange, title, description }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>Ok</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function APIKeyPage({ setCurrentPage, setGeminiApiKey, geminiApiKey, currentPage }: { setCurrentPage: any; setGeminiApiKey: any; geminiApiKey: string; currentPage: number }) {
  const [showAlert, setShowAlert] = useState(false);

  const handleNext = () => {
    if (geminiApiKey.trim().length === 0) {
      setShowAlert(true);
    } else {
      setCurrentPage(currentPage + 1);
    }
  }

  return (
    <>
      <h1>Welcome to Schema Desktop!</h1>
      <p>Get started by introducing your Gemini API key.</p>

      <Input type="password" placeholder='Enter your Gemini API key' name="gemini_api_key" id="gemini-api-key-input" onChange={(e) => setGeminiApiKey(e.target.value)} />

      <div className="flex flex-row w-full justify-between">
        <Button disabled={currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>

      <ValidationAlertDialog
        open={showAlert}
        onOpenChange={setShowAlert}
        title="API Key Required"
        description="Your Gemini API key is required in order to use Schema Desktop."
      />
    </>
  )
}

function UserNamePage({ setCurrentPage, setUserName, userName, currentPage }: { setCurrentPage: any; setUserName: any; currentPage: number, userName: string }) {
  const [showAlert, setShowAlert] = useState(false);

  const handleNext = () => {
    if (userName.trim().length === 0) {
      setShowAlert(true);
    } else {
      setCurrentPage(currentPage + 1);
    }
  }

  return (
    <>
      <h1>Whats Your Name?</h1>
      <p>Please enter your name below.</p>
      <Input type="text" placeholder='Enter your name' name="user_name" id="user-name-input" onChange={(e) => setUserName(e.target.value)} />

      <div className="flex flex-row w-full justify-between">
        <Button disabled={currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)}>Back</Button>
      <Button onClick={handleNext}>Next</Button>
      </div>

      <ValidationAlertDialog
        open={showAlert}
        onOpenChange={setShowAlert}
        title="Name Required"
        description="Please enter your name to continue setup."
      />
    </>
  )
}

function FinishPage({ geminiApiKey, userName }: { geminiApiKey: string; userName: string }) {
  const handleSumbit = async () => {
    await localStorage.setItem('user_name', userName);
    await invoke('store_api_key', { apiKey: geminiApiKey });
    await invoke('initialize_database');

    router.push('/schemas')
  }

  const router = useRouter();

  return (
    <>
      <h1>Ok {userName}. All Set!</h1>
      <p>You're ready to start using Schema Desktop.</p>
      <Button onClick={handleSumbit}>Finish</Button>
    </>
  )
}

export default function App() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [userName, setUserName] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  return (
    <div className='flex flex-row justify-center items-center w-dvw h-dvh'>
      <div className='w-md rounded-4xl border border-muted p-10'>

        <div className='flex flex-col gap-8'>
          {
            currentPage === 0 ? (
              <APIKeyPage setCurrentPage={setCurrentPage} setGeminiApiKey={setGeminiApiKey} geminiApiKey={geminiApiKey} currentPage={currentPage} />
            ) : currentPage === 1 ? (
              <UserNamePage setCurrentPage={setCurrentPage} setUserName={setUserName} userName={userName} currentPage={currentPage} />
            ) : (
                  <FinishPage geminiApiKey={geminiApiKey} userName={userName} />
            )
          }
        </div>

      </div>
    </div>
  )
}