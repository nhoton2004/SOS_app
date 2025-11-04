import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { HomeIcon, ShieldAlertIcon, UsersIcon, MessageSquareIcon, MapPinIcon } from './icons';
import { sosService } from '../services/sosService';
import { volunteerService } from '../services/volunteerService';
import { articleService } from '../services/articleService';
import { userService } from '../services/userService';
import { CaseStatus } from '../types';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string; }> = ({ icon, title, value, color }) => (
    <div className="bg-gray-800 rounded-lg p-6 flex items-center shadow-lg">
        <div className={`mr-4 p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const [activeSOSCount, setActiveSOSCount] = useState(0);
    const [pendingVolunteers, setPendingVolunteers] = useState(0);
    const [pendingPosts, setPendingPosts] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sosCases, setSosCases] = useState<any[]>([]);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markers = useRef<maplibregl.Marker[]>([]);
    const mapReady = useRef<boolean>(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fetch tất cả SOS cases và filter ở frontend
                const [sosRes, volunteersRes, postsRes, usersRes] = await Promise.all([
                    sosService.getSosCases({ limit: 100 }), // Fetch nhiều để có đủ data
                    volunteerService.getVolunteers({ status: 'PENDING', limit: 1 }),
                    articleService.getArticles({ category: 'COMMUNITY', status: 'PENDING', limit: 1 }),
                    userService.getUsers({ limit: 1 }),
                ]);

                // Response format từ backend: { success: true, data: [...], pagination: {...} }
                // sosRes đã là response.data từ axios, nên cần kiểm tra sosRes.data hoặc sosRes
                const allSosCases = (sosRes && sosRes.data && Array.isArray(sosRes.data)) 
                    ? sosRes.data 
                    : (Array.isArray(sosRes) ? sosRes : []);
                
                // Filter các cases đang hoạt động (không phải RESOLVED hoặc CANCELLED)
                const activeCases = allSosCases.filter((caseItem: any) => 
                    caseItem && caseItem.status && !['RESOLVED', 'CANCELLED'].includes(caseItem.status)
                );

                console.log('Dashboard - Full response:', sosRes);
                console.log('Dashboard - All SOS cases:', allSosCases);
                console.log('Dashboard - Active SOS cases:', activeCases);
                console.log('Dashboard - Active count:', activeCases.length);

                setActiveSOSCount(activeCases.length);
                setSosCases(activeCases);
                setPendingVolunteers(volunteersRes.pagination?.total || volunteersRes.data?.length || 0);
                setPendingPosts(postsRes.pagination?.total || postsRes.data?.length || 0);
                setTotalUsers(usersRes.pagination?.total || usersRes.data?.length || 0);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Initialize MapLibre map
    useEffect(() => {
        // Đợi container sẵn sàng
        const initMap = () => {
            if (!mapContainer.current) {
                console.log('Map container not ready yet, retrying...');
                setTimeout(initMap, 100);
                return;
            }

            if (map.current) {
                console.log('Map already initialized');
                return;
            }

            console.log('Initializing MapLibre map...', mapContainer.current);

            // Initialize map với style đơn giản hơn
            try {
                map.current = new maplibregl.Map({
                    container: mapContainer.current,
                    style: {
                        version: 8,
                        sources: {
                            'osm': {
                                type: 'raster',
                                tiles: [
                                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                                ],
                                tileSize: 256,
                                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            }
                        },
                        layers: [
                            {
                                id: 'osm-layer',
                                type: 'raster',
                                source: 'osm',
                                minzoom: 0,
                                maxzoom: 22
                            }
                        ]
                    },
                    center: [105.8342, 21.0278], // Center of Vietnam
                    zoom: 6
                });

                console.log('Map instance created, waiting for load...');

                // Add navigation controls
                map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

                map.current.on('load', () => {
                    console.log('Map loaded successfully');
                    mapReady.current = true;
                    // Trigger markers update sau khi map load xong
                    if (sosCases.length > 0) {
                        console.log('Map loaded, will trigger markers update...');
                        // Đợi một chút để đảm bảo map hoàn toàn sẵn sàng
                        setTimeout(() => {
                            if (map.current) {
                                console.log('Triggering markers from map load event');
                                // Force update bằng cách tạo shallow copy
                                setSosCases([...sosCases]);
                            }
                        }, 200);
                    }
                });

                map.current.on('error', (e: any) => {
                    console.error('Map error:', e);
                });

                map.current.on('style.load', () => {
                    console.log('Map style loaded');
                    // Nếu map đã load và style đã load, trigger markers
                    if (mapReady.current && sosCases.length > 0) {
                        console.log('Style loaded, triggering markers update...');
                        setTimeout(() => {
                            if (map.current) {
                                setSosCases([...sosCases]);
                            }
                        }, 200);
                    }
                });
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };

        // Bắt đầu khởi tạo map
        initMap();

        return () => {
            // Clear markers before removing map
            markers.current.forEach(marker => marker.remove());
            markers.current = [];
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update markers when sosCases change
    useEffect(() => {
        // Skip nếu không có cases
        if (!sosCases.length) {
            // Clear markers nếu không có cases
            markers.current.forEach(marker => marker.remove());
            markers.current = [];
            return;
        }

        // Đợi map được khởi tạo và load xong
        let retryCount = 0;
        const maxRetries = 50; // Tối đa 15 giây (50 * 300ms)
        
        const addMarkers = () => {
            if (!map.current) {
                retryCount++;
                if (retryCount > maxRetries) {
                    console.error('Map initialization timeout after', maxRetries, 'retries');
                    return;
                }
                console.log(`Map not initialized yet, retrying... (${retryCount}/${maxRetries})`);
                setTimeout(addMarkers, 300);
                return;
            }

            // Kiểm tra map đã sẵn sàng chưa - sử dụng mapReady ref thay vì loaded()
            const isMapReady = mapReady.current && map.current && map.current.isStyleLoaded();
            console.log('Map ready status:', mapReady.current, 'Style loaded:', map.current.isStyleLoaded(), 'Overall ready:', isMapReady);
            
            if (!isMapReady) {
                console.log('Map not fully ready yet, will wait for load/style.load events...');
                // Nếu map chưa ready, đợi events sẽ trigger setSosCases để gọi lại addMarkers
                return;
            }

            console.log('Map ready, adding markers for', sosCases.length, 'cases');

            // Clear existing markers
            markers.current.forEach(marker => marker.remove());
            markers.current = [];

            if (!sosCases.length) {
                console.log('No SOS cases to display');
                return;
            }

            // Add markers for each SOS case
            const bounds = new maplibregl.LngLatBounds();
            let hasValidLocation = false;
            
            // Track markers at same location để offset chúng
            const locationMap = new Map<string, number>();

            sosCases.forEach((sosCase: any) => {
                const location = sosCase.location || sosCase.reporterLocation;
                console.log('Processing case:', sosCase.code || sosCase._id, 'Location:', location);
                
                if (!location || !location.coordinates || !Array.isArray(location.coordinates)) {
                    console.log('Invalid location for case:', sosCase.code || sosCase._id, 'Location object:', location);
                    return;
                }

                const [lng, lat] = location.coordinates; // GeoJSON format: [lng, lat]
                console.log('Case coordinates:', { lng, lat, caseCode: sosCase.code || sosCase._id });
                
                if (!lng || !lat || isNaN(lng) || isNaN(lat)) {
                    console.log('Invalid coordinates:', lng, lat);
                    return;
                }

                hasValidLocation = true;
                const userName = sosCase.reporterId?.fullName || sosCase.user?.name || sosCase.reporterId?.name || 'Unknown';
                const caseCode = sosCase.code || sosCase._id || sosCase.id || 'Unknown';

                // Kiểm tra xem có markers nào ở cùng vị trí không để offset
                const locationKey = `${lng.toFixed(6)}_${lat.toFixed(6)}`;
                const offsetCount = locationMap.get(locationKey) || 0;
                locationMap.set(locationKey, offsetCount + 1);
                
                // Tính offset nhỏ cho markers ở cùng vị trí (mỗi marker offset khoảng 10px)
                const offsetX = (offsetCount % 3 - 1) * 15; // -15, 0, 15
                const offsetY = Math.floor(offsetCount / 3) * 15; // 0, 15, 30, ...

                // Create marker element với styling đầy đủ
                const el = document.createElement('div');
                el.className = 'sos-marker';
                
                // Set all styles inline để đảm bảo hiển thị
                // Với anchor: 'center', MapLibre sẽ tự căn giữa
                el.style.cssText = `
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: #ef4444;
                    border: 4px solid white;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.7);
                    position: relative;
                    z-index: ${1000 + offsetCount};
                    animation: pulse 2s infinite;
                    display: block;
                    pointer-events: auto;
                `;
                
                // Nếu có offset, thêm transform để tách markers
                if (offsetCount > 0) {
                    el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                }
                
                el.innerHTML = `
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 16px;
                        height: 16px;
                        background: white;
                        border-radius: 50%;
                        z-index: 1001;
                    "></div>
                `;

                // Create popup
                const popup = new maplibregl.Popup({ 
                    offset: 25,
                    closeButton: true,
                    closeOnClick: false
                })
                    .setHTML(`
                        <div style="padding: 8px;">
                            <strong style="color: #1f2937;">${caseCode}</strong><br/>
                            <span style="color: #6b7280;">${userName}</span><br/>
                            <span style="color: #6b7280; font-size: 12px;">${sosCase.status || 'N/A'}</span>
                        </div>
                    `);

                // Create marker - anchor ở center để chấm đỏ bám đúng vị trí
                // MapLibre sẽ tự động update vị trí marker khi map zoom/pan
                const marker = new maplibregl.Marker({
                    element: el,
                    anchor: 'center',
                    draggable: false
                })
                    .setLngLat([lng, lat])
                    .setPopup(popup)
                    .addTo(map.current!);
                
                // Verify marker được set đúng tọa độ
                const markerLngLat = marker.getLngLat();
                console.log('Marker LngLat set:', markerLngLat.lng, markerLngLat.lat, 'Expected:', lng, lat);

                console.log('Marker added for case:', caseCode, 'at coordinates:', [lng, lat]);
                markers.current.push(marker);
                bounds.extend([lng, lat]);
            });

            // Fit map to show all markers
            if (hasValidLocation && markers.current.length > 0) {
                try {
                    // Đợi một chút để đảm bảo markers đã được render
                    setTimeout(() => {
                        if (map.current && markers.current.length > 0) {
                            map.current.fitBounds(bounds, {
                                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                                maxZoom: 12,
                                duration: 1000
                            });
                            console.log('Map bounds fitted successfully for', markers.current.length, 'markers');
                        }
                    }, 100);
                } catch (error) {
                    console.error('Error fitting bounds:', error);
                }
            } else {
                console.log('No valid markers to fit bounds. hasValidLocation:', hasValidLocation, 'markers count:', markers.current.length);
            }
        };

        // Bắt đầu thêm markers (hàm addMarkers sẽ tự retry nếu map chưa sẵn sàng)
        addMarkers();
    }, [sosCases]);

    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-white mb-8">Bảng điều khiển</h1>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Bảng điều khiển</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    icon={<ShieldAlertIcon className="h-6 w-6 text-white"/>} 
                    title="Ca SOS đang hoạt động" 
                    value={activeSOSCount.toString()} 
                    color="bg-red-500"
                />
                <StatCard 
                    icon={<UsersIcon className="h-6 w-6 text-white"/>} 
                    title="TNV chờ duyệt" 
                    value={pendingVolunteers.toString()} 
                    color="bg-yellow-500"
                />
                <StatCard 
                    icon={<MessageSquareIcon className="h-6 w-6 text-white"/>} 
                    title="Bài viết chờ duyệt" 
                    value={pendingPosts.toString()} 
                    color="bg-blue-500"
                />
                 <StatCard 
                    icon={<UsersIcon className="h-6 w-6 text-white"/>} 
                    title="Tổng số người dùng" 
                    value={totalUsers.toString()} 
                    color="bg-purple-500"
                />
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg relative">
                <h2 className="text-xl font-semibold text-white mb-4">Bản đồ SOS đang hoạt động</h2>
                <div className="relative w-full rounded-md overflow-hidden border-2 border-gray-600" style={{ height: '384px', minHeight: '384px' }}>
                    <div 
                        ref={mapContainer}
                        className="w-full h-full"
                        style={{ width: '100%', height: '100%', minHeight: '384px' }}
                    />
                    {sosCases.length === 0 && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
                            <p className="text-gray-400 bg-gray-800 px-4 py-2 rounded">Không có ca SOS nào đang hoạt động.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;