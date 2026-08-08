const WebSocket = require('ws');

// Render يفرض قراءة المنفذ تلقائياً عبر متغيرات البيئة PORT
const PORT = process.env.PORT || 8080;
const server = new WebSocket.Server({ port: PORT });

// تخزين بيانات اللاعبين (الحد الأقصى الموصى به 50 لاعباً)
let players = {};

console.log(🚀 السيرفر العالمي يعمل الآن بنجاح على المنفذ: ${PORT});

server.on('connection', (ws) => {
    // توليد معرف فريد تلقائياً لكل لاعب يدخل الغرفة
    const playerId = "User_" + Math.random().toString(36).substring(2, 7);
    console.log([+] لاعب جديد دخل السيرفر. المعرف الحالي: ${playerId});

    // إرسال بيانات الترحيب والـ ID للاعب فور دخوله
    ws.send(JSON.stringify({ type: 'init', id: playerId }));

    // استقبال تحديثات الحركة والموقع من الـ Mod Menu الخاص باللاعب
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // عند تحرك اللاعب، يتم تحديث إحداثياته في الذاكرة
            if (data.type === 'move') {
                players[playerId] = {
                    x: data.x,
                    y: data.y,
                    z: data.z,
                    rotation: data.rotation
                };

                // بث ومزامنة مواقع الـ 50 لاعباً لبعضهم البعض في نفس الجزء من الثانية
                broadcast({
                    type: 'update',
                    players: players
                });
            }
        } catch (e) {
            // تجاهل الأخطاء البسيطة لمنع انهيار السيرفر أثناء الضغط
        }
    });

    // عند خروج اللاعب من اللعبة أو قفل الـ Mod Menu
    ws.on('close', () => {
        console.log([-] اللاعب ${playerId} غادر السيرفر التزامني.);
        delete players[playerId]; // حذفه فوراً لتفريغ المساحة للاعبين آخرين
        
        // إبلاغ بقية المتصلين ليختفي مجسم هذا اللاعب من شاشاتهم
        broadcast({
            type: 'player_left',
            id: playerId
        });
    });
});

// دالة البث الجماعي لإرسال البيانات للجميع في نفس الوقت
function broadcast(data) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
