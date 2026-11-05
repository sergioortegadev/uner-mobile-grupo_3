import React, { useMemo } from "react";
import { Href, Redirect, router, useLocalSearchParams } from "expo-router";
import { CheckNearbyReportsScreen } from "@/components/reportes/verificar-cercanos-screen";
import { setNearbyDecision } from "@/helpers/nearby-decision";
import { Coordenadas } from "@/types";

type ValidNearbyParams = {
  coordinates: Coordenadas;
  typeId: string;
  next?: string;
};

const getParam = (val: string | string[] | undefined): string | undefined => {
  return Array.isArray(val) ? val[0] : val;
};

const parseNearbyParams = (
  latParam?: string | string[],
  lngParam?: string | string[],
  typeIdParam?: string | string[],
  nextParam?: string | string[],
): ValidNearbyParams | null => {
  const latStr = getParam(latParam)?.trim();
  const lngStr = getParam(lngParam)?.trim();
  const typeId = getParam(typeIdParam)?.trim();
  const rawNext = getParam(nextParam)?.trim();

  if (!latStr || !lngStr || !typeId) {
    return null;
  }

  const latitud = Number(latStr);
  const longitud = Number(lngStr);

  const isValid =
    Number.isFinite(latitud) &&
    Number.isFinite(longitud) &&
    latitud >= -90 &&
    latitud <= 90 &&
    longitud >= -180 &&
    longitud <= 180;

  if (!isValid) {
    return null;
  }

  return {
    coordinates: { latitud, longitud },
    typeId,
    next: rawNext,
  };
};

const NearbyReportsRoute = () => {
  const {
    latitud,
    longitud,
    tipoId,
    next: nextParam,
  } = useLocalSearchParams<{
    latitud?: string;
    longitud?: string;
    tipoId?: string;
    next?: string;
  }>();

  const parsed = useMemo(
    () => parseNearbyParams(latitud, longitud, tipoId, nextParam),
    [latitud, longitud, tipoId, nextParam],
  );

  if (!parsed) {
    return <Redirect href="/" />;
  }

  const { coordinates, typeId, next } = parsed;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // "No es ninguno, seguir": vuelve al formulario, que envía el reporte
  const handleContinueNew = () => {
    if (next) {
      router.replace(next as Href);
      return;
    }
    setNearbyDecision("continuar");
    handleBack();
  };

  // Se sumó a un reporte existente: el formulario se limpia al volver
  const handleAdhereSuccess = () => {
    setNearbyDecision("adherido");
    handleBack();
  };

  return (
    <CheckNearbyReportsScreen
      userCoordinates={coordinates}
      typeId={typeId}
      onBack={handleBack}
      onContinueNew={handleContinueNew}
      onAdhereSuccess={handleAdhereSuccess}
    />
  );
};

export default NearbyReportsRoute;
