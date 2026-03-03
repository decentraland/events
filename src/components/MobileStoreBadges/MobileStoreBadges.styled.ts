import { styled } from "decentraland-ui2"

export const StoreBadgesContainer = styled("div")({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  width: "100%",
})

export const StoreBadgeLink = styled("a")({
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
  transition: "opacity 0.2s ease",
  "&:hover": {
    opacity: 0.85,
  },
})

export const StoreBadgeImage = styled("img", {
  shouldForwardProp: (prop) => prop !== "badgeSize",
})<{ badgeSize: "small" | "large" }>(({ badgeSize }) => ({
  height: badgeSize === "small" ? "40px" : "48px",
}))
