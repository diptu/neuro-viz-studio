import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import KnowledgeBase from './pages/KnowledgeBase'
import ProjectDashboard from './pages/ProjectDashboard'
import AnalyticsBenchmarks from './pages/AnalyticsBenchmarks'
import PipelineControl from './pages/PipelineControl'
import SmartExport from './pages/SmartExport'
import ModelSandbox from './pages/ModelSandbox'
import ModelEvalLab from './pages/ModelEvalLab'
import ResearchCanvas from './pages/ResearchCanvas'
import EnvironmentOptimization from './pages/EnvironmentOptimization'
import DeployInterface from './pages/DeployInterface'
import PreviewPage from './pages/PreviewPage'
import TryoutPage from './pages/TryoutPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<KnowledgeBase />} />
        <Route path="/canvas"       element={<PreviewPage />} />
        {/* <Route path="/compose"      element={<LayerComposer />} /> */}
        {/* <Route path="/canvas"       element={<InfinityComposer />} /> */}
        {/* <Route path="/editor"       element={<LegoEditor />} /> */}
        <Route path="/dashboard"    element={<ProjectDashboard />} />
        <Route path="/benchmarks"   element={<AnalyticsBenchmarks />} />
        <Route path="/pipeline"     element={<PipelineControl />} />
        <Route path="/export"       element={<SmartExport />} />
        <Route path="/sandbox"      element={<ModelSandbox />} />
        <Route path="/eval"         element={<ModelEvalLab />} />
        <Route path="/research"     element={<ResearchCanvas />} />
        <Route path="/environment"  element={<EnvironmentOptimization />} />
        {/* <Route path="/diagnostics"  element={<AIDiagnostics />} /> */}
        <Route path="/deploy"       element={<DeployInterface />} />
        <Route path="/tryout"       element={<TryoutPage />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
