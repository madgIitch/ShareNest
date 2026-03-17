import { Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { RequestCard } from '../components/RequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const conversations = [
  {
    id: '1',
    userName: 'Julia Schmidt',
    userAvatar: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzcwNzk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    lastMessage: 'Perfecto! Nos vemos mañana entonces',
    listingTitle: 'Habitación en Kreuzberg',
    timestamp: '10:30',
    unread: 0,
    isFriendz: true
  },
  {
    id: '2',
    userName: 'Max Müller',
    userAvatar: 'https://images.unsplash.com/photo-1613002864483-7464b6bd442e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHBlcnNvbiUyMHNtaWxpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM3MTUyMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    lastMessage: 'Hola! Estoy muy interesado en la habitación',
    listingTitle: 'Piso en Neukölln',
    timestamp: 'Ayer',
    unread: 2
  }
];

const pendingRequests = [
  {
    id: '1',
    requesterName: 'Sophie Wagner',
    requesterAvatar: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MzcwNzk2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    requesterBio: 'Estudiante de diseño · 24 años',
    message: 'Hola! Me encanta tu piso. Soy diseñadora y trabajo desde casa. Busco un lugar tranquilo y con buena luz. Tengo excelentes referencias de mis anteriores compañeros de piso.',
    listingTitle: 'Habitación luminosa en Kreuzberg',
    friendsInCommon: 3,
    verified: true,
    status: 'pending' as const
  },
  {
    id: '2',
    requesterName: 'David Fischer',
    requesterAvatar: 'https://images.unsplash.com/photo-1613002864483-7464b6bd442e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHBlcnNvbiUyMHNtaWxpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzM3MTUyMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    requesterBio: 'Developer · 28 años',
    message: 'Buenos días! Acabo de mudarme a Berlin por trabajo. Me interesa mucho tu habitación, sobre todo la zona que está muy bien conectada.',
    listingTitle: 'Habitación en Friedrichshain',
    friendsInCommon: 0,
    verified: true,
    status: 'pending' as const
  }
];

export function MessagesScreen() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <h1 className="text-2xl text-gray-900 mb-3">Mensajes</h1>
        
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Buscar conversaciones..." 
            className="pl-10 rounded-full border-gray-200"
          />
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="chats" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="chats" className="rounded-md text-sm relative">
              Chats
              {conversations.some(c => c.unread > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-md text-sm relative">
              Solicitudes
              {pendingRequests.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs h-5 min-w-5 flex items-center justify-center rounded-full px-1">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Chats Tab */}
          <TabsContent value="chats" className="mt-0">
            <div className="space-y-1 -mx-4">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <ImageWithFallback 
                      src={conv.userAvatar} 
                      alt={conv.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conv.unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">{conv.unread}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-gray-900">{conv.userName}</h4>
                      {conv.isFriendz && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0">
                          Friendz
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{conv.listingTitle}</p>
                    <p className={`text-sm line-clamp-1 ${conv.unread > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  
                  <span className="text-xs text-gray-400 flex-shrink-0">{conv.timestamp}</span>
                </button>
              ))}
            </div>
          </TabsContent>
          
          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-0">
            <div className="space-y-3 -mx-4 px-4 pt-4">
              {pendingRequests.map((request) => (
                <RequestCard 
                  key={request.id} 
                  {...request} 
                  onAccept={() => console.log('Accept:', request.id)}
                  onDeny={() => console.log('Deny:', request.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Content is handled by tabs */}
      </div>
    </div>
  );
}
