import AdminEventForm from '../AdminEventForm';

export default function AdminEventFormExample() {
  return (
    <div className="p-4 bg-background max-w-2xl">
      <AdminEventForm
        onSubmit={(data) => console.log('Event created:', data)}
      />
    </div>
  );
}
