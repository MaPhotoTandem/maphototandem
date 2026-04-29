// Types partagés dans l'application

export interface Photo {
  id: string        // Format: "2026-04-11/3/DSC_001.jpg"
  url: string       // URL signée (expire après 2h)
  filename: string  // "DSC_001.jpg"
  size?: number     // Taille en bytes
}

export interface Flight {
  date: string      // Format: "2026-04-11"
  envol: string     // Numéro d'envolée, ex: "3"
  photoCount: number
}

export interface CartItem {
  photo: Photo
  price: number     // En cents
}
