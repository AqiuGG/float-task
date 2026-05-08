; FloatTask custom NSIS script - set default install path to D:\Program Files\FloatTask

!macro customInit
  StrCpy $INSTDIR "D:\Program Files\FloatTask"
!macroend
