// src/stores/perfil.ts
import { defineStore } from 'pinia'

export type PerfilState = {
  avatar: string | null      // DataURL o URL
  nombre: string
  telefono: string           // 10 dígitos MX p.ej.
  email: string
  sexo: string
  edad: string               // la manejamos como texto (ej. '35')
  comunidad: string          // solo lectura en perfil (viene del back)
  municipio: string          // solo lectura en perfil (viene del back)
  asesorNombre: string
  asesorTelefono: string
}

const STORAGE_KEY = 'perfil_kikirutas'

export const usePerfilStore = defineStore('perfil', {
  state: (): PerfilState => ({
  avatar: null,          // se cargará desde auth.user en UserProfile
  nombre: '',
  telefono: '',
  email: '',
  sexo: '',
  edad: '',
  comunidad: '',
  municipio: '',
  asesorNombre: '',
  asesorTelefono: '',
}),


  actions: {
    // Actualiza campos del perfil y persiste
    set(payload: Partial<PerfilState>) {
      Object.assign(this, payload)
      this.persist()
    },

    // Guarda en localStorage
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      } catch (err) {
        console.error('No se pudo guardar el perfil en localStorage', err)
      }
    },

    // Carga desde localStorage (si existe)
    load() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        Object.assign(this, parsed)
      } catch (err) {
        console.error('No se pudo leer el perfil desde localStorage', err)
      }
    },

    // Limpia perfil y storage
    clear() {
      localStorage.removeItem(STORAGE_KEY)
      this.avatar = null
      this.nombre = ''
      this.telefono = ''
      this.email = ''
      this.comunidad = ''
      this.municipio = ''
      this.asesorNombre = ''
      this.asesorTelefono = ''
    },
  },
})
