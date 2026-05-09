; FloatTask custom NSIS script - set default install path to D:\Program Files\FloatTask
; Compatible with Windows 7 SP1+

!macro customInit
  StrCpy $INSTDIR "D:\Program Files\FloatTask"
!macroend
