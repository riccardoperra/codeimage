import {themeVars} from '@codeimage/ui';
import { darkGrayScale } from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const main = style({
  display: 'flex',
  margin: 'auto',
  flexDirection: "column",
  overflow: 'hidden',
  height: '100vh',
  width:"100%",
  background: "#090909"
});

export const imageBox = style({
  position: 'relative',
  flex: 1,
});

export const textBox = style({
  flex: 1,
});

export const text = style({
  width: '50%',
  textAlign: "center"
});

export const imageLeft = style({
  transform: 'translate(-50%, 0px)',
  position: 'absolute',
  width: "75%",
  left:"50%",
});

export const imageRight = style({
  transform: 'translate(70%, 0px)',
  position: 'absolute',
  width: "75%",
  left:"0",
});

export const backdrop = style({
  position: "absolute",
  height: "1000px",
  width: "100%",
  left: "50%",
  top: "-1000px",
  filter: "blur(250px)",
  opacity: ".5",
  backgroundImage: `linear-gradient(90deg, #0071ff, #ad00ff 48.44%, #0071ff)`,
  overflow: "hidden"
})

export const screenshot = style({
  display: "inline-block",
  position: "relative",
  "::before" :{
    content: "",
    width: "100%",
    height: "px",
    bottom: 0,
    position: "absolute",
    backgroundColor: themeVars.backgroundColor.blue[600]
  }
})