import { Settings, Users, MapPin, CheckCircle, Share2, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const userProfile = {
  name: 'Ana Rodríguez',
  username: '@anarodriguez',
  avatar: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzcwNzk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
  bio: 'Diseñadora gráfica · Amante de los gatos · Busco buen rollo 🌿',
  city: 'Berlin',
  memberSince: 'Marzo 2024',
  verified: true,
  friendsCount: 47,
  listingsCount: 2,
  isSuperfriendz: false
};

const friendsList = [
  {
    id: '1',
    name: 'Julia Schmidt',
    avatar: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzcwNzk2OXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '2',
    name: 'Max Müller',
    avatar: 'https://images.unsplash.com/photo-1613002864483-7464b6bd442e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHBlcnNvbiUyMHNtaWxpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM3MTUyMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '3',
    name: 'Sophie Wagner',
    avatar: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzcwNzk2OXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '4',
    name: 'David Fischer',
    avatar: 'https://images.unsplash.com/photo-1613002864483-7464b6bd442e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHBlcnNvbiUyMHNtaWxpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM3MTUyMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

export function ProfileScreen() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h1 className="text-2xl text-gray-900">Perfil</h1>
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        {/* Profile Header */}
        <div className="px-4 pb-4">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative">
              <ImageWithFallback 
                src={userProfile.avatar} 
                alt={userProfile.name}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-500 ring-offset-2"
              />
              {userProfile.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white fill-blue-500" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl text-gray-900">{userProfile.name}</h2>
                {userProfile.isSuperfriendz && (
                  <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
                )}
              </div>
              <p className="text-sm text-gray-500 mb-2">{userProfile.username}</p>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span>{userProfile.city}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-gray-500">Miembro desde {userProfile.memberSince}</span>
              </div>
            </div>
          </div>
          
          {/* Bio */}
          <p className="text-gray-700 mb-4">{userProfile.bio}</p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl text-gray-900 mb-1">{userProfile.friendsCount}</div>
              <div className="text-xs text-gray-500">Friendz</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl text-gray-900 mb-1">{userProfile.listingsCount}</div>
              <div className="text-xs text-gray-500">Anuncios</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl text-gray-900 mb-1">100%</div>
              <div className="text-xs text-gray-500">Respuesta</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-full">
              <Share2 className="w-4 h-4 mr-2" />
              Compartir perfil
            </Button>
            <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
              Editar perfil
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Superfriendz Upsell */}
        {!userProfile.isSuperfriendz && (
          <div className="mx-4 mt-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white mb-1">Hazte Superfriendz</h3>
                <p className="text-sm text-white/90 mb-3">
                  Anuncios ilimitados, estadísticas y badge destacado
                </p>
                <Button className="bg-white text-orange-600 hover:bg-white/90 rounded-full">
                  Ver planes
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Friendz Section */}
        <div className="mt-4 bg-white rounded-2xl mx-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Mis Friendz
            </h3>
            <Button variant="ghost" size="sm" className="text-emerald-600">
              Ver todos
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {friendsList.map((friend) => (
              <button key={friend.id} className="flex flex-col items-center gap-2">
                <ImageWithFallback 
                  src={friend.avatar} 
                  alt={friend.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <span className="text-xs text-gray-700 text-center line-clamp-2">{friend.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Trust Score */}
        <div className="mt-4 bg-white rounded-2xl mx-4 p-4">
          <h3 className="text-gray-900 mb-3">Insignias de confianza</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Teléfono verificado</p>
                <p className="text-xs text-gray-500">Verificado el 15 marzo 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Red activa</p>
                <p className="text-xs text-gray-500">{userProfile.friendsCount} conexiones verificadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
