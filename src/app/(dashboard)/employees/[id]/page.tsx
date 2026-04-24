import EmployeeDetailClient from './EmployeeDetailClient';

// Static export: pre-render a placeholder route; real IDs handled client-side via useParams.
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function EmployeeDetailPage() {
  return <EmployeeDetailClient />;
}
