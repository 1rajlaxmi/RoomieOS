import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const navigate = useNavigate();
  // State to hold the user's data once we load it from local storage
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // 1. When the page loads, check for the token and user data
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      // 2. Security Check: If no token is found, kick them to the login page immediately
      navigate("/login");
    } else {
      // 3. If everything is good, parse the user data and display it
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    // 4. Destroy the token and user data from the browser, then redirect
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // If the user hasn't loaded yet, don't show anything to prevent weird flashing
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Bar Area */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">RoomieOS</h1>
          <Button variant="outline" onClick={handleLogout}>Log out</Button>
        </div>

        {/* Welcome Card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to your Dashboard, {user.name}!</CardTitle>
            <CardDescription>You are currently logged in as {user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
              <p className="text-slate-700">
                <strong>Looking a bit empty right now?</strong> <br />
                Tomorrow, we will build out the Household Management system so you can create an apartment, invite your flatmates via a unique code, and start splitting expenses right here!
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}