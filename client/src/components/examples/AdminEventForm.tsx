import AdminEventForm from '../AdminEventForm';

export default function AdminEventFormExample() {
  return (
    <div className="p-4 bg-background max-w-2xl">
      <AdminEventForm
        onSuccess={() => console.log('Event created successfully')}
      />
    </div>
  );
}
