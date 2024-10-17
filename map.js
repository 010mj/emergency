document.addEventListener("DOMContentLoaded", async () => {
    async function getLatLon(url) {
        try {
            let responseHosInfo = await fetch(url);
            if (!responseHosInfo.ok) {
                throw new Error(`HTTP error! status: ${responseHosInfo.status}`);
            }
            let t_xml_hosInfo = await responseHosInfo.text();
            let parseXMLHosInfo = new DOMParser();
            let xmlDocHosInfo = parseXMLHosInfo.parseFromString(t_xml_hosInfo, "text/xml");
            let hosInfoObject = xmlDocHosInfo.querySelectorAll("items item");

            let coordinates = [];
            hosInfoObject.forEach(value => {
                let lat = value.querySelector("wgs84Lat").textContent;
                let lon = value.querySelector("wgs84Lon").textContent;
                coordinates.push({ lat, lon });
            });
            return coordinates;
        } catch (error) {
            console.error("Error fetching data:", error);
            return null;
        }
    }

    const getLanLonUrl = "https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytBassInfoInqire?serviceKey=6N1JeuU2GFvmzRpDpgjpymP4hREckoNOTCBysivZs3BakGZwtFTvdBNyf3e50vP8BaFH9O4GALYgNiUaHLIuUA%3D%3D&HPID=";

    var mapContainer = document.getElementById('map'),
        mapOption = {
            center: new kakao.maps.LatLng(37.5366059, 126.9771397),
            level: 8
        };

    var map = new kakao.maps.Map(mapContainer, mapOption);
    
    let hospitalData = [];
    let markers = [];

    // 병원 데이터
    (async () => {
        let responseEmer = await fetch("https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEmrrmRltmUsefulSckbdInfoInqire?serviceKey=6N1JeuU2GFvmzRpDpgjpymP4hREckoNOTCBysivZs3BakGZwtFTvdBNyf3e50vP8BaFH9O4GALYgNiUaHLIuUA%3D%3D&STAGE1=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C&numOfRows=100");
        let t_xml_emer = await responseEmer.text();
        let parseXMLEmer = new DOMParser();
        let xmlDocEmer = parseXMLEmer.parseFromString(t_xml_emer, "text/xml");
        let emerObject = xmlDocEmer.querySelectorAll("items item");

        emerObject.forEach(value => {
            let name = value.querySelector("dutyName").textContent;
            let hpid = value.querySelector("hpid").textContent;
            let usableBed = value.querySelector("hvec").textContent;
            let totalBed = value.querySelector("hvs01").textContent;
            let tel = value.querySelector("dutyTel3").textContent;

            hospitalData.push({ name, hpid, usableBed, totalBed, tel });

            getLatLon(getLanLonUrl + hpid).then((data) => {
                var markerPosition = new kakao.maps.LatLng(data[0].lat, data[0].lon);
                var marker = new kakao.maps.Marker({
                    map: map,
                    position: markerPosition
                });
                markers.push({ marker, position: markerPosition, name, tel, usableBed, totalBed });

                var infowindow = new kakao.maps.InfoWindow({
                    content: `<div style="padding:5px;">${name}<br>${tel}<br>${usableBed}/${totalBed} (가용병상/총병상)</div>`
                });

                kakao.maps.event.addListener(marker, 'mouseover', function() {
                    infowindow.open(map, marker);
                });
                kakao.maps.event.addListener(marker, 'mouseout', function() {
                    infowindow.close();
                });
            });
        });
    })();

    // 검색창
    function performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const resultList = document.getElementById('resultList');
        resultList.innerHTML = '';

        const filteredHospitals = hospitalData.filter(hospital => hospital.name.toLowerCase().includes(searchTerm));

        filteredHospitals.forEach(hospital => {
            const li = document.createElement('li');
            li.textContent = hospital.name + '▶ 전화번호 : ' + hospital.tel;
            li.style.cursor = 'pointer';
            li.addEventListener('click', () => {
                const markerData = markers.find(m => m.name === hospital.name);
                if (markerData) {
                    map.setCenter(markerData.position);
                    const infowindow = new kakao.maps.InfoWindow({
                        content: `<div style="padding:5px;">${hospital.name}<br>${hospital.tel}<br>${hospital.usableBed}/${hospital.totalBed} (가용병상/총병상)</div>`
                    });
                    infowindow.open(map, markerData.marker);
                }
            });
            resultList.appendChild(li);
        });

        if (filteredHospitals.length === 0) {
            resultList.innerHTML = '<li>검색 결과가 없습니다.</li>';
        }
    }

    document.getElementById('searchButton').addEventListener('click', performSearch);
    
    // Add search on Enter key
    document.getElementById('searchInput').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            performSearch();
        }
    });
});
