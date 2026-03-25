import { Check, X, Users } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface RequestCardProps {
  id: string;
  requesterName: string;
  requesterAvatar: string;
  requesterBio?: string;
  message: string;
  listingTitle: string;
  friendsInCommon?: number;
  verified?: boolean;
  status: 'pending' | 'accepted' | 'denied';
  onAccept?: () => void;
  onDeny?: () => void;
}

export function RequestCard({
  requesterName,
  requesterAvatar,
  requesterBio,
  message,
  listingTitle,
  friendsInCommon,
  verified,
  status,
  onAccept,
  onDeny
}: RequestCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative">
          <ImageWithFallback 
            src={requesterAvatar} 
            alt={requesterName}
            className="w-12 h-12 rounded-full object-cover"
          />
          {verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-gray-900">{requesterName}</h4>
          {requesterBio && (
            <p className="text-sm text-gray-500 line-clamp-1">{requesterBio}</p>
          )}
          {friendsInCommon !== undefined && friendsInCommon > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-600">{friendsInCommon} amigos en común</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Listing Reference */}
      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
        <p className="text-xs text-gray-500 mb-0.5">Interesado en:</p>
        <p className="text-sm text-gray-900">{listingTitle}</p>
      </div>
      
      {/* Message */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 line-clamp-3">{message}</p>
      </div>
      
      {/* Actions */}
      {status === 'pending' && (
        <div className="flex gap-2">
          <Button 
            onClick={onDeny}
            variant="outline" 
            className="flex-1 rounded-full"
          >
            <X className="w-4 h-4 mr-1" />
            Rechazar
          </Button>
          <Button 
            onClick={onAccept}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
          >
            <Check className="w-4 h-4 mr-1" />
            Aceptar
          </Button>
        </div>
      )}
      
      {status === 'accepted' && (
        <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm text-center">
          ✓ Solicitud aceptada
        </div>
      )}
      
      {status === 'denied' && (
        <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm text-center">
          Solicitud rechazada
        </div>
      )}
    </div>
  );
}
