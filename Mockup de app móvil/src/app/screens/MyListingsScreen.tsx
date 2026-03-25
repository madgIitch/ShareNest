import { Plus, Eye, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const myListings = [
  {
    id: '1',
    title: 'Habitación luminosa en Kreuzberg',
    status: 'active',
    price: 650,
    image: 'https://images.unsplash.com/photo-1594873604892-b599f847e859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzM3MzA2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    views: 234,
    requests: 12
  },
  {
    id: '2',
    title: 'Apartamento completo 2 habitaciones',
    status: 'active',
    price: 1100,
    image: 'https://images.unsplash.com/photo-1599243272864-e9dd455966bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZXJsaW4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc3Mzc1NjY3Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    views: 156,
    requests: 5
  }
];

export function MyListingsScreen() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl text-gray-900">Mis Anuncios</h1>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg">
            <Plus className="w-5 h-5 mr-1" />
            Nuevo
          </Button>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="active" className="rounded-md text-sm">
              Activos
            </TabsTrigger>
            <TabsTrigger value="paused" className="rounded-md text-sm">
              Pausados
            </TabsTrigger>
            <TabsTrigger value="rented" className="rounded-md text-sm">
              Alquilados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Listings */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        <div className="space-y-3">
          {myListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="flex gap-3 p-3">
                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <ImageWithFallback 
                    src={listing.image} 
                    alt={listing.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <Badge className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-0.5">
                    Activo
                  </Badge>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 line-clamp-2 mb-1">{listing.title}</h3>
                  <p className="text-emerald-600 mb-2">{listing.price}€/mes</p>
                  
                  <div className="flex gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{listing.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-emerald-600">{listing.requests}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="border-t border-gray-100 px-3 py-2 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-full text-sm">
                  Ver solicitudes
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 rounded-full text-sm">
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty State Example */}
        <div className="mt-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-gray-900 mb-2">Crea tu primer anuncio</h3>
          <p className="text-sm text-gray-500 mb-4">
            Publica tu habitación o busca piso entre amigos
          </p>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
            Crear anuncio
          </Button>
        </div>
      </div>
    </div>
  );
}
