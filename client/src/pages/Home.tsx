import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Thermometer, Users, Cloud, BarChart3 } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Thermometer className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">ClimateControl</h1>
          </div>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Ir al Dashboard
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-white mb-4">Sistema de Gestión Climática Inteligente</h2>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Control de temperatura en tiempo real para aulas, integrado con Arduino. Monitorea el confort de los alumnos basado en ocupación, hora del día y época del año.
        </p>
        {isAuthenticated && (
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-lg"
          >
            Acceder al Sistema
          </Button>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-8 py-16">
        <h3 className="text-3xl font-bold text-white mb-12 text-center">Características Principales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Users className="w-12 h-12 text-cyan-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Gestión de Alumnos</h4>
            <p className="text-slate-400">Registro automático de asistencia mediante códigos QR en tiempo real</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Thermometer className="w-12 h-12 text-cyan-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Control Térmico</h4>
            <p className="text-slate-400">Cálculo automático de temperatura óptima según RITE/ASHRAE</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition cursor-pointer" onClick={() => navigate("/arduino-setup")}>
            <Cloud className="w-12 h-12 text-cyan-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Integración Arduino</h4>
            <p className="text-slate-400">Conecta directamente con tu placa Arduino UNO R4 WiFi</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition cursor-pointer" onClick={() => navigate("/dashboard")}>
            <BarChart3 className="w-12 h-12 text-cyan-400 mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Análisis</h4>
            <p className="text-slate-400">Historial y estadísticas de sesiones y confort térmico</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20">
        <div className="max-w-7xl mx-auto px-8 py-8 text-center text-slate-400">
          <p>Sistema de Gestión Climática Inteligente para Aulas - Integración Arduino UNO R4 WiFi</p>
        </div>
      </footer>
    </div>
  );
}
