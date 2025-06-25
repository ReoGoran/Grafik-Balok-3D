// Inisialisasi canvas dan context
const canvas1 = document.getElementById('canvas1');
const ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');

// Variabel rotasi
let rotationX = 0;
let rotationY = 0;

// Definisi titik-titik kotak 3D (bukan kubus - dimensi berbeda)
// Koordinat 3D: [x, y, z]
const boxVertices = [
    // Bagian depan
    [-100, -75, 50],   // 0: kiri atas depan
    [100, -75, 50],    // 1: kanan atas depan
    [100, 75, 50],     // 2: kanan bawah depan
    [-100, 75, 50],    // 3: kiri bawah depan
    
    // Bagian belakang
    [-100, -75, -50],  // 4: kiri atas belakang
    [100, -75, -50],   // 5: kanan atas belakang
    [100, 75, -50],    // 6: kanan bawah belakang
    [-100, 75, -50]    // 7: kiri bawah belakang
];

// Definisi garis-garis (edges) yang menghubungkan titik-titik
const boxEdges = [
    // Garis bagian depan
    [0, 1], [1, 2], [2, 3], [3, 0],
    // Garis bagian belakang
    [4, 5], [5, 6], [6, 7], [7, 4],
    // Garis penghubung depan-belakang
    [0, 4], [1, 5], [2, 6], [3, 7]
];

// Definisi face untuk hidden line removal
const boxFaces = [
    [0, 1, 2, 3], // depan
    [5, 4, 7, 6], // belakang
    [4, 0, 3, 7], // kiri
    [1, 5, 6, 2], // kanan
    [0, 4, 5, 1], // atas
    [3, 2, 6, 7]  // bawah
];

// Fungsi untuk mengkonversi derajat ke radian
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Fungsi rotasi 3D
function rotateX(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
        point[0],
        point[1] * cos - point[2] * sin,
        point[1] * sin + point[2] * cos
    ];
}

function rotateY(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
        point[0] * cos + point[2] * sin,
        point[1],
        -point[0] * sin + point[2] * cos
    ];
}

// Fungsi proyeksi 3D ke 2D (tanpa perspektif)
function project3Dto2D(point) {
    // Sudut pandang dari depan atas sedikit kanan
    // Proyeksi orthogonal sederhana
    return [
        point[0] + canvas1.width / 2,   // X + offset ke tengah canvas
        -point[1] + canvas1.height / 2  // Y terbalik + offset ke tengah canvas
    ];
}

// Fungsi untuk menghitung normal vector suatu face
function calculateNormal(face, vertices) {
    const v1 = vertices[face[0]];
    const v2 = vertices[face[1]];
    const v3 = vertices[face[2]];

    // Vektor edge
    const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

    // Cross product untuk normal vector
    const normal = [
        edge1[1] * edge2[2] - edge1[2] * edge2[1],
        edge1[2] * edge2[0] - edge1[0] * edge2[2],
        edge1[0] * edge2[1] - edge1[1] * edge2[0]
    ];

    return normal;
}

// Fungsi untuk menentukan apakah face terlihat (facing camera)
function isFaceVisible(face, vertices) {
    const normal = calculateNormal(face, vertices);
    // Asumsikan kamera di z positif, face terlihat jika normal.z > 0
    return normal[2] > 0;
}

// Fungsi untuk menggambar garis
function drawLine(ctx, from, to, color = '#000') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
}

// Fungsi render PART 1 (Wireframe)
function renderWireframe() {
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);

    // Transform vertices
    const transformedVertices = boxVertices.map(vertex => {
        let rotated = rotateX(vertex, toRadians(rotationX));
        rotated = rotateY(rotated, toRadians(rotationY));
        return project3Dto2D(rotated);
    });

    // Gambar semua garis
    boxEdges.forEach(edge => {
        const from = transformedVertices[edge[0]];
        const to = transformedVertices[edge[1]];
        drawLine(ctx1, from, to, '#2196F3');
    });

    // Gambar titik-titik vertex
    transformedVertices.forEach((vertex, index) => {
        ctx1.fillStyle = '#F44336';
        ctx1.beginPath();
        ctx1.arc(vertex[0], vertex[1], 3, 0, 2 * Math.PI);
        ctx1.fill();
    });
}

// Fungsi render PART 2 (Hidden Line Removal)
function renderHiddenLineRemoval() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    // Transform vertices
    const transformed3D = boxVertices.map(vertex => {
        let rotated = rotateX(vertex, toRadians(rotationX));
        rotated = rotateY(rotated, toRadians(rotationY));
        return rotated;
    });

    const transformed2D = transformed3D.map(vertex => project3Dto2D(vertex));

    // Tentukan face mana yang terlihat
    const visibleFaces = boxFaces.filter(face => 
        isFaceVisible(face, transformed3D)
    );

    // Gambar hanya garis dari face yang terlihat
    const visibleEdges = new Set();
    
    visibleFaces.forEach(face => {
        for (let i = 0; i < face.length; i++) {
            const currentVertex = face[i];
            const nextVertex = face[(i + 1) % face.length];
            
            // Buat edge key yang konsisten (always smaller index first)
            const edgeKey = currentVertex < nextVertex ? 
                `${currentVertex}-${nextVertex}` : 
                `${nextVertex}-${currentVertex}`;
            
            visibleEdges.add(edgeKey);
        }
    });

    // Gambar garis yang terlihat
    visibleEdges.forEach(edgeKey => {
        const [v1, v2] = edgeKey.split('-').map(Number);
        const from = transformed2D[v1];
        const to = transformed2D[v2];
        drawLine(ctx2, from, to, '#4CAF50');
    });

    // Gambar titik-titik vertex yang terlihat
    const visibleVertices = new Set();
    visibleFaces.forEach(face => {
        face.forEach(vertex => visibleVertices.add(vertex));
    });

    visibleVertices.forEach(vertexIndex => {
        const vertex = transformed2D[vertexIndex];
        ctx2.fillStyle = '#F44336';
        ctx2.beginPath();
        ctx2.arc(vertex[0], vertex[1], 3, 0, 2 * Math.PI);
        ctx2.fill();
    });
}

// Fungsi update tampilan
function updateDisplay() {
    renderWireframe();
    renderHiddenLineRemoval();
    
    // Update info rotasi
    document.getElementById('rotX1').textContent = Math.round(rotationX);
    document.getElementById('rotY1').textContent = Math.round(rotationY);
    document.getElementById('rotX2').textContent = Math.round(rotationX);
    document.getElementById('rotY2').textContent = Math.round(rotationY);
}

// Event listener untuk keyboard
document.addEventListener('keydown', function(event) {
    const rotationStep = 5; // derajat per langkah
    
    switch(event.key.toLowerCase()) {
        case 'w':
            rotationX -= rotationStep;
            break;
        case 's':
            rotationX += rotationStep;
            break;
        case 'a':
            rotationY -= rotationStep;
            break;
        case 'd':
            rotationY += rotationStep;
            break;
        default:
            return; // Keluar jika bukan tombol yang diinginkan
    }
    
    // Normalisasi sudut (0-360 derajat)
    rotationX = ((rotationX % 360) + 360) % 360;
    rotationY = ((rotationY % 360) + 360) % 360;
    
    updateDisplay();
    event.preventDefault(); // Mencegah scroll page
});

// Inisialisasi tampilan
updateDisplay();

// Tampilkan instruksi
console.log("=== PROJECT 2: 3D GRAFIK SEDERHANA ===");
console.log("Kontrol:");
console.log("W - Rotasi X ke depan");
console.log("S - Rotasi X ke belakang");
console.log("A - Rotasi Y ke kiri");
console.log("D - Rotasi Y ke kanan");
console.log("=====================================");