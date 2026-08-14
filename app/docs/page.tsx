import ReactUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default async function ApiDocsPage() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '20px' }}>
      <ReactUI url="/api/doc" />
    </div>
  )
}
