import { CambioPasswordData } from "@/components/types/CambiarPasswordData";
import { UsuarioData } from "@/components/types/UsuarioData";
import { UsuarioDataPerfil } from "@/components/types/UsuarioDataPerfil";
import { API_BASE_URL } from "@/lib/config"


export async function validarSesion(): Promise<{ user?: any } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/usuarios/validar`, {
      credentials: "include",
      method: "GET",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error al validar sesión:", error);
    return null;
  }
}

export async function loginUsuario(email: string, password: string): Promise<{ user?: any }> {
  try {
    const res = await fetch(`${API_BASE_URL}/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data) {
      throw new Error(data?.message || "Error desconocido al iniciar sesión");
    }

    return data;
  } catch (error) {
    console.error("Error en loginUsuario:", error);
    throw error;
  }
}

export async function cerrarSesion(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/logout`, {
      method: "DELETE",
      credentials: "include",
    });

    return response.ok;
  } catch (error) {
    console.error("Error en logout:", error);
    return false;
  }
}

export async function registerUser(data: UsuarioData) {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/registrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Error al registrar el usuario.")
    }

    return result
  } catch (error: any) {
    throw new Error(error.message || "Error desconocido")
  }
}

export async function cambiarPassword(data: CambioPasswordData): Promise<void> {

  const response = await fetch(`${API_BASE_URL}/usuarios/${data.userId}/cambiar-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentPassword: data.currentPassword || "",
      newPassword: data.newPassword,
      requireCurrent: data.requireCurrent ?? true, // ✅ si no se manda, asume true por defecto
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "No se pudo cambiar la contraseña")
  }
}

export async function editarUsuarioPerfil(usuario: UsuarioDataPerfil): Promise<void> {

  const response = await fetch(`${API_BASE_URL}/usuarios/${usuario.userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      FullName: usuario.fullName,
      Email: usuario.email,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Error en la respuesta de la API:", errorText)
    throw new Error("No se pudo editar el usuario")
  }
}

export async function obtenerUsuarioPorEmail(email: string) {
  const url = `${API_BASE_URL}/usuarios/por-email/${encodeURIComponent(email)}`
  console.log("📡 GET:", url)

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    console.error("❌ Backend respondió mal:", text)
    throw new Error("Usuario no encontrado")
  }
  const data = await res.json()
  return data
}

export async function enviarEnlaceReset(email: string): Promise<void> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL


  const res = await fetch(`${API_BASE_URL}/usuarios/enviar-enlace-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, cliente: "ecommerce" }),
  });

  if (!res.ok) {
    throw new Error("No se pudo enviar el enlace");
  }
}
