import React, { useEffect, useRef, useState } from "react";
import BackButton from "@/components/BackButton";

// Добавляем объявление для window.ymaps
declare global {
  interface Window {
    ymaps: any;
  }
}

const YMAPS_API_KEY = "d6c6cb3f-7170-4fa2-9f61-f88ab3e3a7e3"; // основной ключ для карт
const SUGGEST_API_KEY = "c218ca5a-2ce6-411d-88fc-acd971ccd37e"; // ключ для GeoSuggest

function haversine([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CampusMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [progress, setProgress] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Инициализация карты и SuggestView
  useEffect(() => {
    if (!window.ymaps) {
      const script = document.createElement("script");
      script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${YMAPS_API_KEY}&suggest_apikey=${SUGGEST_API_KEY}`;
      script.type = "text/javascript";
      script.onload = () => {
        window.ymaps.ready(() => {
          if (inputRef.current) {
            new window.ymaps.SuggestView(inputRef.current);
          }
        });
      };
      document.head.appendChild(script);
    } else {
      window.ymaps.ready(() => {
        if (inputRef.current) {
          new window.ymaps.SuggestView(inputRef.current);
        }
      });
    }
  }, []);

  // Получить координаты пользователя
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается вашим браузером");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        alert("Местоположение получено! Теперь выберите или введите точку B и постройте маршрут.");
      },
      () => alert("Не удалось получить местоположение")
    );
  };

  // Геокодирование по адресу
  const geocode = async (addr: string) => {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_API_KEY}&format=json&geocode=${encodeURIComponent(addr)}`;
    const res = await fetch(url);
    const data = await res.json();
    const pos = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos
      .split(" ")
      .map(Number);
    return [pos[1], pos[0]];
  };

  // Построение маршрута и запуск анимации
  const buildRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCoords || !window.ymaps || !mapRef.current) {
      alert("Сначала разрешите доступ к местоположению и выберите точку B!");
      return;
    }
    const addressB = inputRef.current?.value || "";
    if (!addressB) {
      alert("Введите или выберите точку B!");
      return;
    }
    const pointA = userCoords;
    const pointB = await geocode(addressB);

    window.ymaps.ready(() => {
      let map = (mapRef.current as any).ymap;
      if (!map) {
        map = new window.ymaps.Map(mapRef.current, {
          center: pointA,
          zoom: 14,
        });
        (mapRef.current as any).ymap = map;
      }
      map.geoObjects.removeAll();

      window.ymaps.route([pointA, pointB]).then((route: any) => {
        route.getPaths().options.set({
          strokeColor: "#A166FF",
          opacity: 0.9,
          strokeWidth: 6,
        });
        map.geoObjects.add(route);
        map.setBounds(route.getBounds(), { checkZoomRange: true });

        // Получаем координаты маршрута
        const coords = route.getPaths().get(0).getCoordinates();
        setProgress(0);

        // Ставим маркер в начало
        const marker = new window.ymaps.Placemark(coords[0], { balloonContent: "Вы движетесь по маршруту" }, { preset: "islands#violetDotIcon" });
        map.geoObjects.add(marker);

        // Анимация движения маркера
        if (intervalId) clearInterval(intervalId);
        let i = 0;
        const id = setInterval(() => {
          i++;
          if (i >= coords.length) {
            clearInterval(id);
            setIntervalId(null);
            return;
          }
          marker.geometry.setCoordinates(coords[i]);
          setProgress(i / (coords.length - 1));
        }, 50);
        setIntervalId(id);
      });

      // Метки начальной и конечной точек
      const placemarkA = new window.ymaps.Placemark(pointA, { balloonContent: "Моё местоположение" });
      const placemarkB = new window.ymaps.Placemark(pointB, { balloonContent: addressB });
      map.geoObjects.add(placemarkA);
      map.geoObjects.add(placemarkB);
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8">
      <BackButton className="mb-2 sm:mb-4" />
      <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-6">Маршрут от моего местоположения</h1>
      <form onSubmit={buildRoute} className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
        <button
          type="button"
          className="px-4 sm:px-6 py-2 rounded-md sm:rounded bg-[#A166FF] text-white font-semibold text-sm sm:text-base"
          onClick={handleGetLocation}
        >
          Использовать моё местоположение
        </button>
        <input
          ref={inputRef}
          className="px-3 sm:px-4 py-2 rounded-md sm:rounded border border-[#EAD7FF] w-full text-sm sm:text-base"
          placeholder="Точка B (адрес, кафе, магазин...)"
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-4 sm:px-6 py-2 rounded-md sm:rounded bg-[#A166FF] text-white font-semibold text-sm sm:text-base"
        >
          Построить маршрут
        </button>
      </form>
      <div className="w-full h-2 sm:h-3 bg-[#EAD7FF] rounded mb-3 sm:mb-4 overflow-hidden">
        <div
          className="h-2 sm:h-3 bg-[#A166FF] transition-all"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "260px",
          maxHeight: "50vh",
          background: "#EAD7FF",
          borderRadius: "12px",
        }}
        className="mb-2 sm:mb-0"
      />
      <div className="mt-1 sm:mt-2 text-right text-xs sm:text-sm text-[#A166FF] font-semibold">
        {Math.round(progress * 100)}% маршрута пройдено
      </div>
    </div>
  );
}
