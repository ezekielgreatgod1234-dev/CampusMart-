function Greeting({ profile }) {
  const firstName =
    profile?.fullName?.trim()?.split(" ")[0] || "there";

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">
        Welcome, {firstName}! 👋
      </h1>

      <p className="text-gray-500 mt-2">
        What are you shopping for today?
      </p>
    </div>
  );
}

export default Greeting;