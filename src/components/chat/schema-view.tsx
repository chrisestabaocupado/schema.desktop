'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeBlock } from '../code-block'

import type { Schemas } from '@/types/chat'

export function SchemaView({
  schemas,
}: { schemas: Schemas }) {
  const [activeTab, setActiveTab] = useState('sql')

  return (
    <div className="space-y-4 h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sql">SQL</TabsTrigger>
          <TabsTrigger value="mongo">MongoDB</TabsTrigger>
        </TabsList>

        {Object.entries(schemas).map(([key, schema]) => (
          <TabsContent key={key} value={key} className="mt-0 h-full">
            <Card className="p-4 h-full border-none shadow-none">
              <CodeBlock language={key} script={schema} />
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
