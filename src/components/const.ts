import { SearchIcon } from "./SearchIcon";

export const MapboxAccessToken =
  "pk.eyJ1Ijoiam9oYW5uZXM2MCIsImEiOiJjbHEzbTE4ZjEwYzN1MmtxdTBreXY5aWczIn0.YBYL7DY2965n-ba3p_wWcA";

export const theme = {
  variables: {
    minWidth: "100%",
    border: "none",
    boxShadow: "none",
  },
  icons: {
    search: SearchIcon(),
  },
  cssText: `
        .Input,
        .Input:focus,
        .SearchBox {
            border-radius: 20px;
            padding: 0 24px;
            line-height: 50px;
            border: none;
            font-size: 14px;
            border-radius: 30px;
          }
          .Results,
          .SearchBox {
            box-shadow: 0px 4px 9px 0px rgba(37, 41, 45, 0.3);
          }
          .SearchIcon {
            left: 20px;
            fill: #41434C;
            top: 5px;
          }
          .ActionIcon {
            right: 20px;
          }
          .Results {
            margin-left: -20px;
            width: 245px;
            min-width: unset;
          }
          `,
};
