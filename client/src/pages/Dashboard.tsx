
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Thermometer, Users, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {

  const [, navigate] = useLocation();
  const [sessionName, setSessionName] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const activeSession = trpc.sessions.getActive.useQuery();
  const sessionsList = trpc.sessions.list.useQuery();

  const createSessionMutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      setSessionName("");
      setSessionDescription("");
      setIsCreating(false);
      activeSession.refetch();
      sessionsList.refetch();
    },
  });

  // Removed activate and close mutations - not needed with sessionCode approach

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;
    await createSessionMutation.mutateAsync({
      name: sessionName,
      description: sessionDescription,
    });
  };

  const handleCloseSession = () => {
    // Session closing logic would go here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Sistema de Gestión Climática</h1>
          <p className="text-slate-400">Sistema de Gestión Climática para Aulas</p>
        </div>
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      {activeSession.data ? (
        <Card className="mb-8 border-2 border-cyan-500 bg-slate-800 shadow-lg shadow-cyan-500/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-white">{activeSession.data.name}</CardTitle>
                <CardDescription className="text-slate-400">Sesión Activa</CardDescription>
              </div>
              <Button
                variant="destructive"
                onClick={handleCloseSession}
                disabled={false}
              >
                Cerrar Sesión
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300 text-sm">Alumnos Presentes</span>
                </div>
                <p className="text-3xl font-bold text-white">{activeSession.data?.id ? 'Cargando...' : '0'}</p>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300 text-sm">Hora de Inicio</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {new Date(activeSession.data.startTime).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-5 h-5 text-cyan-400" />
                  <span className="text-slate-300 text-sm">Estado</span>
                </div>
                <p className="text-lg font-semibold text-white">Monitoreando...</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Alumnos Conectados</h3>
              <div className="bg-slate-700 rounded-lg border border-slate-600 overflow-hidden">
                {false ? (
                  <div className="divide-y divide-slate-600">
                    {[].map((student: any) => (
                      <div key={student.id} className="p-3 flex justify-between items-center hover:bg-slate-600 transition">
                        <div>
                          <p className="font-medium text-white">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-slate-400">{student.studentId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-cyan-400">
                            {new Date(student.checkInTime).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {student.checkOutTime && (
                            <p className="text-xs text-slate-400">Salida: {new Date(student.checkOutTime).toLocaleTimeString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                    No hay alumnos conectados
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-2 border-slate-600 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">No hay sesión activa</CardTitle>
            <CardDescription className="text-slate-400">Crea o activa una sesión para comenzar</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="mb-8">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Nueva Sesión</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Crear Nueva Sesión</DialogTitle>
              <DialogDescription className="text-slate-400">Ingresa los detalles de la nueva sesión de aula</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">
                  Nombre de la Sesión
                </Label>
                <Input
                  id="name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Ej: Clase de Física - Grupo A"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white">
                  Descripción (Opcional)
                </Label>
                <Textarea
                  id="description"
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="Notas adicionales..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending || !sessionName.trim()}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {createSessionMutation.isPending ? "Creando..." : "Crear Sesión"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-2 border-slate-600 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Historial de Sesiones</CardTitle>
          <CardDescription className="text-slate-400">Últimas sesiones registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsList.isLoading ? (
            <p className="text-slate-400">Cargando...</p>
          ) : sessionsList.data && sessionsList.data.length > 0 ? (
            <div className="space-y-2">
              {sessionsList.data.map((session: any) => (
                <div
                  key={session.id}
                  className="flex justify-between items-center p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-cyan-500 transition cursor-pointer"
                  onClick={() => {}}
                >
                  <div>
                    <p className="font-medium text-white">{session.name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(session.startTime).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Activar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">No hay sesiones registradas</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
