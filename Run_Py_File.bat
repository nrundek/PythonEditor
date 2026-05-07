@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 > nul
title Pokretanje Python datoteke

cd /d "%~dp0"

if not exist "programs" mkdir "programs"

echo Pokretanje Python datoteke.
echo Mapa pokretača:
echo %cd%
echo.
echo Datoteke se traže u ovoj mapi i u podmapi programs.
echo.

where py > nul 2> nul
if %errorlevel%==0 (
    set "PYTHON_CMD=py -3"
) else (
    where python > nul 2> nul
    if %errorlevel%==0 (
        set "PYTHON_CMD=python"
    ) else (
        echo Python nije pronađen.
        echo Instaliraj Python ili provjeri je li dodan u PATH.
        echo.
        pause
        exit /b 1
    )
)

set "COUNT=0"
for %%F in (*.py) do (
    set /a COUNT+=1
    set "FILE!COUNT!=%%F"
)
for %%F in (programs\*.py) do (
    if exist "%%F" (
        set /a COUNT+=1
        set "FILE!COUNT!=%%F"
    )
)

if "%COUNT%"=="0" (
    echo Nema Python datoteke s nastavkom .py.
    echo Spremi .py datoteku u istu mapu u kojoj je ova BAT datoteka ili u podmapu programs.
    echo.
    pause
    exit /b 1
)

if "%COUNT%"=="1" (
    set "SELECTED=!FILE1!"
    goto RUN_FILE
)

echo Pronađeno je više Python datoteka.
echo Odaberi broj datoteke koju želiš pokrenuti:
echo.
for /L %%I in (1,1,%COUNT%) do echo %%I. !FILE%%I!
echo.
set /p CHOICE=Upiši broj i pritisni Enter: 

if not defined CHOICE (
    echo Nije odabrana datoteka.
    pause
    exit /b 1
)

set "SELECTED=!FILE%CHOICE%!"
if not defined SELECTED (
    echo Neispravan odabir.
    pause
    exit /b 1
)

:RUN_FILE
echo.
echo Pokrenuta naredba:
echo %PYTHON_CMD% "%SELECTED%"
echo.
%PYTHON_CMD% "%SELECTED%"
set "EXIT_CODE=%errorlevel%"
echo.
echo Program je završen s izlaznim kodom %EXIT_CODE%.
echo.
pause
exit /b %EXIT_CODE%
