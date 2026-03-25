import { Heart, MapPin, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface ListingCardProps {
  id: string;
  title: string;
  type: 'offer' | 'search';
  price: number;
  city: string;
  district?: string;
  rooms: number;
  size_m2: number;
  image: string;
  ownerName: string;
  ownerAvatar: string;
  isFriendz?: boolean;
  friendsInCommon?: number;
  verified?: boolean;
}

export function ListingCard({
  title,
  type,
  price,
  city,
  district,
  rooms,
  size_m2,
  image,
  ownerName,
  ownerAvatar,
  isFriendz,
  friendsInCommon,
  verified
}: ListingCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Image Section */}
      <div className="relative aspect-[4/3]">
        <ImageWithFallback 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={type === 'offer' ? 'bg-emerald-500' : 'bg-blue-500'}>
            {type === 'offer' ? 'Oferta' : 'Busco'}
          </Badge>
        </div>
        
        {/* Like Button */}
        <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
          <Heart className="w-5 h-5 text-gray-700" />
        </button>
        
        {/* Trust Badge */}
        {(isFriendz || friendsInCommon) && (
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-sm">
              {isFriendz ? (
                <span className="text-emerald-600">Friendz</span>
              ) : (
                <span className="text-gray-700">{friendsInCommon} amigos en común</span>
              )}
            </span>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl text-gray-900">{price}€</span>
          <span className="text-sm text-gray-500">/mes</span>
        </div>
        
        {/* Title */}
        <h3 className="text-gray-900 mb-2 line-clamp-2">{title}</h3>
        
        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span>{district ? `${district}, ${city}` : city}</span>
        </div>
        
        {/* Details */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
          <span>{rooms} hab.</span>
          <span className="text-gray-300">•</span>
          <span>{size_m2} m²</span>
        </div>
        
        {/* Owner Info */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <ImageWithFallback 
              src={ownerAvatar} 
              alt={ownerName}
              className="w-8 h-8 rounded-full object-cover"
            />
            {verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          <span className="text-sm text-gray-700">{ownerName}</span>
        </div>
      </div>
    </div>
  );
}
