import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import { ListingCard } from '../components/ListingCard';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const mockListings = [
  {
    id: '1',
    title: 'Habitación luminosa en Kreuzberg',
    type: 'offer' as const,
    price: 650,
    city: 'Berlin',
    district: 'Kreuzberg',
    rooms: 1,
    size_m2: 18,
    image: 'https://images.unsplash.com/photo-1594873604892-b599f847e859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzM3MzA2ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ownerName: 'Julia Schmidt',
    ownerAvatar: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzcwNzk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    isFriendz: true,
    verified: true
  },
  {
    id: '2',
    title: 'Busco piso compartido en Neukölln',
    type: 'search' as const,
    price: 700,
    city: 'Berlin',
    district: 'Neukölln',
    rooms: 1,
    size_m2: 20,
    image: 'https://images.unsplash.com/photo-1579632151052-92f741fb9b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYmVkcm9vbSUyMGFwYXJ0bWVudHxlbnwxfHx8fDE3NzM3MzYzNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ownerName: 'Max Müller',
    ownerAvatar: 'https://images.unsplash.com/photo-1613002864483-7464b6bd442e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHBlcnNvbiUyMHNtaWxpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM3MTUyMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    friendsInCommon: 3,
    verified: true
  },
  {
    id: '3',
    title: 'Apartamento completo con balcón',
    type: 'offer' as const,
    price: 1200,
    city: 'Berlin',
    district: 'Prenzlauer Berg',
    rooms: 2,
    size_m2: 55,
    image: 'https://images.unsplash.com/photo-1599243272864-e9dd455966bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZXJsaW4lMjBhcGFydG1lbnQlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc3Mzc1NjY3Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    ownerName: 'Sophie Wagner',
    ownerAvatar: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzcwNzk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    friendsInCommon: 1,
    verified: false
  },
  {
    id: '4',
    title: 'Habitación grande en WG de 3',
    type: 'offer' as const,
    price: 580,
    city: 'Berlin',
    district: 'Friedrichshain',
    rooms: 1,
    size_m2: 22,
    image: 'https://images.unsplash.com/photo-1593853761096-d0423b545cf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmlnaHQlMjBraXRjaGVuJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3Mzc1NjY3M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    ownerName: 'Lena Becker',
    ownerAvatar: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzcwNzk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    verified: true
  }
];

export function ExploreScreen() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-2xl text-gray-900 flex-1">Explorar</h1>
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Buscar por ciudad, barrio..." 
            className="pl-10 rounded-full border-gray-200"
          />
        </div>
        
        {/* Filter Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <Badge variant="default" className="bg-emerald-500 text-white px-3 py-1.5 rounded-full whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            Berlin
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 rounded-full whitespace-nowrap">
            Solo Friendz
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 rounded-full whitespace-nowrap">
            Ofertas
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5 rounded-full whitespace-nowrap">
            Búsquedas
          </Badge>
        </div>
      </div>
      
      {/* Listings Grid */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        <div className="grid gap-4">
          {mockListings.map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>
      </div>
    </div>
  );
}
