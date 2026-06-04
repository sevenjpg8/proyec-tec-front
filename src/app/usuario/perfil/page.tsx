"use client"

import type React from "react"
import { useState } from "react"
import {
  User,
  Settings,
  ChevronRight,
  LogOut,
  ShoppingBag,
  Package,
  Mail,
  ArrowLeft,
  Eye,
  EyeOff,
  X,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validarSesion, cerrarSesion as cerrarSesionService, cambiarPassword } from "@/services/usuarios"
import { obtenerHistorialDeOrdenes } from "@/services/ordenes"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { OrderMapped } from "@/components/types/carrito"
import EventoDialog from "@/components/custom/pdf/EventoDialog"
import { editarUsuarioPerfil } from "@/services/usuarios"
import { toast } from "sonner"
import { useUserStore } from "@/stores/userStore"
import { useNotifications } from "@/components/principales/NotificationsContext"

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("purchases")
  const [comprados, setComprados] = useState<OrderMapped[]>([])
  const router = useRouter()
  const [usuario, setUsuario] = useState<{ fullName: string; email: string; userId: string } | null>(null)
  const [perfilEditable, setPerfilEditable] = useState({
    fullName: "",
    email: "",
  })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialogPassword, setShowSuccessDialogPassword] = useState(false)
  const [showSuccessDialogProfile, setShowSuccessDialogProfile] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const [notificacionesPorPagina] = useState(3) // 5 notificaciones por página

  // Usar el contexto de notificaciones
  const {
    notificaciones,
    notificacionesNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
  } = useNotifications()

  // Estado para errores por campo
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    async function checkSesion() {
      const res = await validarSesion()
      if (!res || !res.user) {
        router.push("/usuario/login")
      } else {
        setUsuario({
          fullName: res.user.fullName,
          email: res.user.email,
          userId: res.user.userId,
        })
        setPerfilEditable({
          fullName: res.user.fullName,
          email: res.user.email,
        })
      }
    }

    checkSesion()
  }, [router])

  useEffect(() => {
    async function cargarComprados() {
      const ordenes = await obtenerHistorialDeOrdenes()
      if (ordenes) setComprados(ordenes)
    }

    cargarComprados()
  }, [])

  async function cerrarSesion() {
    const clearUser = useUserStore.getState().clearUser
    const ok = await cerrarSesionService()
    if (ok) {
      clearUser()
      sessionStorage.setItem("logout", "true")
      router.push("/usuario/login")
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } else {
      console.error("Error al cerrar sesión")
    }
  }

  function handlePasswordChange(field: string, value: string) {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }))
  }

  function handleCancelPasswordChange() {
    setShowPasswordChange(false)
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  // ✅ Solo valida y abre el dialog - NO llama al API
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errors = { currentPassword: "", newPassword: "", confirmPassword: "" }
    let hasError = false

    if (passwordData.newPassword.length < 8) {
      errors.newPassword = "La contraseña debe tener al menos 8 caracteres"
      hasError = true
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden"
      hasError = true
    }

    if (!usuario?.userId) {
      return toast.error("No se pudo obtener el usuario")
    }

    setPasswordErrors(errors)  // ✅ siempre se ejecuta
    if (hasError) return        // ✅ corta DESPUÉS de setear errores

    setShowConfirmDialog(true)
  }
  // ✅ Esta es la que llama al API
  async function confirmarCambioDePassword() {
    setShowConfirmDialog(false)
    if (!usuario?.userId) return toast.error("No se pudo obtener el usuario")

    try {
      await cambiarPassword({
        userId: usuario.userId,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      setShowSuccessDialogPassword(true)
      handleCancelPasswordChange()
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error al cambiar la contraseña"
      // Si el error es de contraseña actual, mostrarlo bajo ese campo
      if (mensaje.toLowerCase().includes("actual")) {
        setPasswordErrors((prev) => ({ ...prev, currentPassword: mensaje }))
      } else {
        toast.error(mensaje)
      }
    }
  }

  async function handleGuardarCambios() {
    if (!usuario?.userId) {
      return toast.error("No se pudo obtener el usuario")
    }

    try {
      await editarUsuarioPerfil({
        userId: usuario.userId,
        fullName: perfilEditable.fullName,
        email: perfilEditable.email,
      })
      setShowSuccessDialogProfile(true)
    } catch (error) {
      toast.error("Error al guardar los cambios")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex flex-col justify-center flex-1 text-center sm:text-left">
                  <CardTitle className="text-lg">{usuario?.fullName || "Usuario"}</CardTitle>
                  <p className="text-sm text-gray-500">{usuario?.email || "correo@ejemplo.com"}</p>
                </div>
              </CardHeader>
              <CardContent>
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveSection("account")}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-purple-600 ${activeSection === "account" ? "bg-purple-50 text-purple-600" : ""
                      }`}
                  >
                    <div className="flex items-center">
                      <User
                        className={`mr-3 h-5 w-5 ${activeSection === "account" ? "text-purple-600" : "text-gray-400"}`}
                      />
                      <span>Mi cuenta</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveSection("notifications")}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-purple-600 ${activeSection === "notifications" ? "bg-purple-50 text-purple-600" : ""
                      }`}
                  >
                    <div className="flex items-center">
                      <Mail
                        className={`mr-3 h-5 w-5 ${activeSection === "notifications" ? "text-purple-600" : "text-gray-400"}`}
                      />
                      <span>Notificaciones</span>
                      {notificacionesNoLeidas > 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {notificacionesNoLeidas}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveSection("purchases")}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-purple-600 ${activeSection === "purchases" ? "bg-purple-50 text-purple-600" : ""
                      }`}
                  >
                    <div className="flex items-center">
                      <ShoppingBag
                        className={`mr-3 h-5 w-5 ${activeSection === "purchases" ? "text-purple-600" : "text-gray-400"}`}
                      />
                      <span>Mis compras</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveSection("settings")}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-purple-600 ${activeSection === "settings" ? "bg-purple-50 text-purple-600" : ""
                      }`}
                  >
                    <div className="flex items-center">
                      <Settings
                        className={`mr-3 h-5 w-5 ${activeSection === "settings" ? "text-purple-600" : "text-gray-400"}`}
                      />
                      <span>Configuración</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <Separator className="my-2" />
                  <button
                    onClick={cerrarSesion}
                    className="flex w-full items-center rounded-md px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <span>Cerrar sesión</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="md:col-span-2">
            {activeSection === "account" && (
              <Card>
                <CardHeader>
                  <CardTitle>Mi cuenta</CardTitle>
                  <CardDescription>Gestiona tu información personal y preferencias</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                          id="name"
                          value={perfilEditable.fullName}
                          onChange={(e) => setPerfilEditable({ ...perfilEditable, fullName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                          id="email"
                          value={perfilEditable.email}
                          onChange={(e) => setPerfilEditable({ ...perfilEditable, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleGuardarCambios}
                      className="text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
                    >Guardar cambios</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notificaciones</CardTitle>
                  <CardDescription>Revisa tus alertas importantes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificaciones.length === 0 ? (
                    <p className="text-center text-gray-500">No tienes notificaciones.</p>
                  ) : (
                    <>
                      {/* Información de paginación */}
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                        <span>
                          Mostrando {Math.min((paginaActual - 1) * notificacionesPorPagina + 1, notificaciones.length)}{" "}
                          - {Math.min(paginaActual * notificacionesPorPagina, notificaciones.length)} de{" "}
                          {notificaciones.length} notificaciones
                        </span>
                        {notificacionesNoLeidas > 0 && (
                          <span className="text-purple-600 font-medium">{notificacionesNoLeidas} sin leer</span>
                        )}
                      </div>

                      {/* Lista de notificaciones paginadas */}
                      <div className="space-y-4">
                        {notificaciones
                          .slice((paginaActual - 1) * notificacionesPorPagina, paginaActual * notificacionesPorPagina)
                          .map((notif) => (
                            <div
                              key={notif.NotificationId}
                              className={`flex items-start justify-between border rounded-lg p-4 shadow-sm transition-all duration-300 ${!notif.IsRead ? "bg-blue-50 border-blue-200" : "bg-white"
                                }`}
                            >
                              <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                  {!notif.IsRead && (
                                    <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                      Nueva notificación
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-800">{notif.Message}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {!notif.IsRead && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 text-green-600 hover:bg-green-100"
                                    onClick={() => marcarComoLeida(notif.NotificationId)}
                                    title="Marcar como leída"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 text-red-600 hover:bg-red-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    eliminarNotificacion(notif.NotificationId);
                                    const totalPaginas = Math.ceil(
                                      (notificaciones.length - 1) / notificacionesPorPagina
                                    );
                                    if (paginaActual > totalPaginas && totalPaginas > 0) {
                                      setPaginaActual(totalPaginas);
                                    }
                                  }}
                                  title="Eliminar notificación"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>


                      {/* Controles de paginación */}
                      {Math.ceil(notificaciones.length / notificacionesPorPagina) > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                          >
                            Anterior
                          </Button>

                          <div className="flex items-center gap-2">
                            {Array.from(
                              { length: Math.ceil(notificaciones.length / notificacionesPorPagina) },
                              (_, i) => i + 1,
                            )
                              .filter((page) => {
                                // Mostrar solo algunas páginas alrededor de la actual
                                const totalPaginas = Math.ceil(notificaciones.length / notificacionesPorPagina)
                                if (totalPaginas <= 7) return true
                                if (page === 1 || page === totalPaginas) return true
                                if (page >= paginaActual - 1 && page <= paginaActual + 1) return true
                                return false
                              })
                              .map((page, index, array) => (
                                <div key={page} className="flex items-center">
                                  {index > 0 && array[index - 1] !== page - 1 && (
                                    <span className="px-2 text-gray-400">...</span>
                                  )}
                                  <Button
                                    variant={paginaActual === page ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setPaginaActual(page)}
                                    className={
                                      paginaActual === page
                                        ? "w-8 h-8 p-0 bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200"
                                        : "w-8 h-8 p-0 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                                    }
                                  >
                                    {page}
                                  </Button>
                                </div>
                              ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPaginaActual((prev) =>
                                Math.min(prev + 1, Math.ceil(notificaciones.length / notificacionesPorPagina)),
                              )
                            }
                            disabled={paginaActual === Math.ceil(notificaciones.length / notificacionesPorPagina)}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}

                      {/* Acciones globales */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Página {paginaActual} de {Math.ceil(notificaciones.length / notificacionesPorPagina)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={marcarTodasComoLeidas}
                          disabled={notificacionesNoLeidas === 0}
                        >
                          Marcar todas como leídas
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "purchases" && (
              <Card>
                <CardHeader>
                  <CardTitle>Mis compras</CardTitle>
                  <CardDescription>Historial de tus compras recientes</CardDescription>
                </CardHeader>
                <CardContent>
                  {comprados.length === 0 ? (
                    <p className="text-center text-gray-500">No tienes compras aún.</p>
                  ) : (
                    comprados.map((item) => (
                      <div key={item.id} className="mb-4 border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">Pedido #{item.id}</h3>
                            <p className="text-sm text-gray-500">
                              Realizado el {new Date(item.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={new Date(item.date) < new Date() ? "default" : "outline"}
                            className="text-white bg-purple-600"
                          >
                            {new Date(item.date) < new Date() ? "Válido" : "No válido"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium">Entradas de: {item.title}</p>
                            <p className="text-sm text-gray-500">
                              Cantidad: {item.quantity} - Precio total: S/{item.totalPrice}
                            </p>
                          </div>
                          <Dialog>
                            <EventoDialog id={item.id.toString()}></EventoDialog>
                          </Dialog>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuración</CardTitle>
                  <CardDescription>Gestiona tus preferencias y configuración de la cuenta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Seguridad</h3>
                    {!showPasswordChange ? (
                      <Button variant="outline" size="sm" onClick={() => setShowPasswordChange(true)}>
                        Cambiar contraseña
                      </Button>
                    ) : (
                      <div className="border rounded-lg p-6 bg-gray-50">
                        <div className="flex items-center gap-2 mb-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelPasswordChange}
                            className="p-1 h-8 w-8"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <h4 className="text-lg font-medium">Cambiar contraseña</h4>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Contraseña actual</Label>
                            <div className="relative">
                              <Input
                                id="current-password"
                                type={showCurrentPassword ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                                placeholder="Ingresa tu contraseña actual"
                                required
                              />
                              {passwordErrors.currentPassword && (
                                <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">Nueva contraseña</Label>
                            <div className="relative">
                              <Input
                                id="new-password"
                                type={showNewPassword ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                                placeholder="Ingresa tu nueva contraseña"
                                required
                                minLength={8}
                              />
                              {passwordErrors.newPassword && (
                                <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">La contraseña debe tener al menos 8 caracteres</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                            <div className="relative">
                              <Input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                                placeholder="Confirma tu nueva contraseña"
                                required
                              />
                              {passwordErrors.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button type="submit" size="sm">
                              Actualizar contraseña
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleCancelPasswordChange}>
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Popup de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambio de contraseña</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cambiar tu contraseña? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCambioDePassword}>Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup de éxito */}
      <Dialog open={showSuccessDialogPassword} onOpenChange={setShowSuccessDialogPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contraseña actualizada</DialogTitle>
            <DialogDescription>Tu contraseña se ha cambiado exitosamente.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowSuccessDialogPassword(false)}>Aceptar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de éxito para actualización de perfil */}
      <Dialog open={showSuccessDialogProfile} onOpenChange={setShowSuccessDialogProfile}>
        <DialogContent className="sm:max-w-md bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Perfil actualizado
            </DialogTitle>
            <DialogDescription className="text-left space-y-2">
              <p>Tu información ha sido actualizada correctamente.</p>
              <p className="text-sm text-amber-600 font-medium">
                Por seguridad, debes volver a iniciar sesión para ver los cambios reflejados.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSuccessDialogProfile(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                cerrarSesion()
                setShowSuccessDialogProfile(false)
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Cerrar sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
