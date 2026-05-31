"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, MapPin, Ticket } from "lucide-react"
import { fetchEventoById } from "@/services/eventos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatearFecha } from "@/components/types/Fechas"
import type { ItemData } from "@/components/types/ItemData"
import { useParams } from "next/navigation"
import type { TicketData } from "@/components/types/TicketData"
import { fetchTicketsByEventoId } from "@/services/eventos"
import { MapView } from "@/components/principales/map-view"
import { getYoutubeId } from "@/components/types/Video"
import { ShareButton } from "@/components/principales/ShareEvent"
import { API_BASE_URL } from "@/lib/config"
import React from "react"

export default function EventoDetalle() {
  const params = useParams()
  const id = params?.id as string // asegúrate de que sea string
  const [evento, setEvento] = useState<ItemData | null>(null)
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cantidades, setCantidades] = React.useState(() => (tickets ? tickets.map(() => 0) : []))
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [showMaxTicketsPopup, setShowMaxTicketsPopup] = useState(false)
  // Cargar el evento y los tickets
  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        setIsLoading(true)
        const dataEvento = await fetchEventoById(id)
        setEvento(dataEvento)

        const dataTickets = await fetchTicketsByEventoId(id)
        setTickets(dataTickets)
        setIsLoading(false)
      } catch (err) {
        console.error(err)
        setError("No se pudo cargar la información")
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  // Cargar incrementador y decrementador
  useEffect(() => {
    if (tickets && tickets.length > 0) {
      setCantidades(tickets.map(() => 0))
    } else {
      setCantidades([])
    }
  }, [tickets])

  const handleComprar = async () => {
    try {
      const ticketsSeleccionados = tickets
        .map((ticket, index) => ({ ticket, cantidad: cantidades[index] }))
        .filter(({ cantidad }) => cantidad > 0)

      if (ticketsSeleccionados.length === 0) {
        alert("No has seleccionado ninguna entrada")
        return
      }

      const body = {
        eventId: id,
        tickets: ticketsSeleccionados.map(({ ticket, cantidad }) => ({
          ticketId: ticket.id,
          precioUnitario: ticket.precio,
          cantidad: cantidad,
        })),
      }


      const response = await fetch(`${API_BASE_URL}/orders/agregar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Orden creada:", data)
        setShowSuccessPopup(true)
        setTimeout(() => {
          setShowSuccessPopup(false)
        }, 3000) // Desaparece después de 3 segundos
        setCantidades(tickets.map(() => 0))
      } else {
        // 🚨 Usa text() para evitar fallo en el .json()
        const errorText = await response.text()
        console.error("Error al crear orden:", errorText)
        setShowLoginPopup(true)
        setTimeout(() => {
          setShowLoginPopup(false)
        }, 3000)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al procesar la orden: " + (error instanceof Error ? error.message : error))
    }
  }

  const incrementar = (index: number) => {
    const totalActual = cantidades.reduce((acc, val) => acc + val, 0)

    if (totalActual >= 10) {
      setShowMaxTicketsPopup(true)

      setTimeout(() => {
        setShowMaxTicketsPopup(false)
      }, 3000)

      return
    }

    const newCantidades = [...cantidades]
    if (newCantidades[index] < tickets[index].stockDisponible) {
      newCantidades[index] += 1
      setCantidades(newCantidades)
    }
  }

  const decrementar = (index: number) => {
    const newCantidades = [...cantidades]
    if (newCantidades[index] > 0) {
      newCantidades[index] -= 1
      setCantidades(newCantidades)
    }
  }

  const totalSeleccionado = cantidades.reduce((acc, val) => acc + val, 0)
  const totalPrecio = cantidades.reduce((acc, cantidad, idx) => acc + cantidad * tickets[idx].precio, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error || !evento) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || "No se encontró el evento solicitado"}</p>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/eventos">Volver a Eventos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-16">
      <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
        <Image
          src={evento.bannerUrl || "/default-banner.jpg"}
          alt={evento.titulo}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-opacity-40"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto">
            <Link
              href="/eventos"
              className="inline-flex items-center text-white bg-opacity-30 hover:bg-opacity-50 px-4 py-2 rounded-full mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a eventos
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-md">{evento.titulo}</h1>
            {Array.isArray(evento.categorias) && evento.categorias.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {evento.categorias.map((categoria, index) => (
                  <Badge key={index} className="bg-purple-600 hover:bg-purple-700 text-white border-none px-3 py-1">
                    {categoria}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detalles principales */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg border-none rounded-xl overflow-hidden">
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold mb-4">Acerca de este evento</h2>
                  <p className="text-gray-700 mb-6">
                    {evento.descripcion ||
                      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras porttitor metus in enim tincidunt, vel feugiat nunc commodo. Nullam auctor, justo vitae tincidunt ultrices, nisi nulla hendrerit magna, vel tincidunt felis nisi a lectus."}
                  </p>
                  <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden mb-6">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${getYoutubeId(evento.videoUrl || "")}`}
                      title="Video de YouTube"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <h3 className="text-xl font-bold mt-8 mb-4">Detalles del evento</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 mr-3 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Fecha de inicio</p>
                        <p className="text-gray-600">
                          {evento.fechaInicio ? formatearFecha(evento.fechaInicio) : "Fecha no disponible"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="w-5 h-5 mr-3 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Fecha de finalización</p>
                        <p className="text-gray-600">
                          {evento.fechaFinalizacion ? formatearFecha(evento.fechaFinalizacion) : "Fecha no disponible"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 mr-3 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-gray-600">{evento.direccion || "Ubicación no disponible"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mapa */}
                <div className="mt-8">
                  <MapView item={evento} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="bg-white shadow-lg border-none rounded-xl overflow-hidden mb-6">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Información de entradas</h3>

                  {tickets && tickets.length > 0 ? (
                    <div className="space-y-6">
                      {tickets.map((ticket, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{ticket.tipo || "General"}</span>
                            <span className="font-bold text-lg">S/. {ticket.precio}</span>
                          </div>
                          <div className="text-sm text-green-600 mb-3">
                            {ticket.stockDisponible > 0 ? `${ticket.stockDisponible} disponibles` : "Agotado"}
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600">Cantidad:</span>
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={cantidades[index] <= 0}
                                onClick={() => decrementar(index)}
                              >
                                <span className="text-lg">-</span>
                              </Button>
                              <span className="mx-3 font-medium">{cantidades[index]}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={cantidades[index] >= ticket.stockDisponible}
                                onClick={() => incrementar(index)}
                              >
                                <span className="text-lg">+</span>
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm">
                            <span>Subtotal:</span>
                            <span className="font-medium">S/. {(ticket.precio * cantidades[index]).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium">Total:</span>
                          <span className="font-bold text-lg">S/. {totalPrecio.toFixed(2)}</span>
                        </div>

                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 mb-3"
                          disabled={totalSeleccionado === 0}
                          onClick={handleComprar}
                        >
                          <Ticket className="w-4 h-4 mr-2" />
                          {totalSeleccionado > 0 ? "Comprar" : "Selecciona entradas"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No hay entradas disponibles</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <ShareButton />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Popup máximo de entradas */}
      {showMaxTicketsPopup && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl transform animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <Ticket className="w-10 h-10 text-yellow-600" />
            </div>

            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              Límite alcanzado
            </h3>

            <p className="text-gray-500">
              Solo puedes comprar un máximo de 10 entradas por persona.
            </p>
          </div>
        </div>
      )}

      {/* Popup de éxito */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center shadow-2xl transform animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Entrada añadida al carrito</h3>
            <p className="text-gray-600">¡Continúa explorando nuestros eventos para encontrar más!</p>
          </div>
        </div>
      )}

      {/* Popup de logeo */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl transform animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <Ticket className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Inicie sesión para comprar</h3>
            <p className="text-gray-500 mb-6">Acceda a su cuenta para completar la compra y disfrutar de nuestros productos exclusivos.</p>
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 cursor-pointer">
              <Link href="/usuario/login">
                Iniciar Sesión
              </Link>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
