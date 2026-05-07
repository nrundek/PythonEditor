# Accessible Python Editor

Ovaj paket sadrži accessible HTML editor za pisanje, otvaranje, pokretanje i spremanje Python koda.

Ova verzija ima samo jedan način pokretanja u editoru: **Run code**. Kod se izvršava u pregledniku pomoću Pyodidea i rezultat se prikazuje u području **Terminal output**.

## Datoteke

- `index.html` – main editor.
- `app.js` – logika za brojač redaka, otvaranje `.py` datoteka, spremanje i pokretanje koda u pregledniku.
- `styles.css` – stilovi za pristupačan prikaz i prošireni editor koda.
- `python-pravila.html` – Python language rules and examples for computer science education.
- `pokreni_py_datoteku.bat` – dodatni Windows pokretač koji pokreće `.py` datoteku preko lokalno instaliranog Pythona.
- `programi` – predviđena mapa za spremanje Python programa.

## What has changed

- Editor Python koda je proširen na veću širinu.
- Redci se više ne prelamaju automatski; za jako dugačke retke koristi se vodoravno pomicanje.
- Brojevi redaka prikazani su unutar vizualnog okvira editora, ali nisu dio Python koda.
- Redak i stupac više se ne izgovaraju pri običnom pisanju ni čitanju koda strelicama; izgovaraju se nakon Entera, gumba Izgovori položaj ili prečaca Alt+L preko jednog statusnog elementa. Uklonjeno je dvostruko izgovaranje i dodatno čitanje sadržaja retka.
- Upute su dopunjene objašnjenjem spremanja i terminalskog pokretanja.
- BAT datoteka sada traži `.py` datoteke u svojoj mapi i u podmapi `programi`.

## How to use the editor

1. Otvorite `index.html` u web pregledniku.
2. U polje **Ime datoteke** upišite naziv programa, primjerice `zadatak_1.py`.
3. Kod napišite u polje **Python kod**.
4. Brojevi redaka prikazani su unutar vizualnog okvira editora.
5. Redak i stupac ne izgovaraju se pri običnom pisanju ni čitanju koda strelicama. Za najavu položaja pritisnite Enter, gumb **Izgovori položaj** ili prečac **Alt+L** dok je fokus u polju **Python kod**. Najavljuju se samo redak i stupac, bez sadržaja retka i bez dvostruke najave.
6. Brojevi se automatski povećavaju nakon pritiska tipke Enter, ali se ne spremaju u `.py` datoteku.
7. Pritisnite **Run code**.
7. Rezultat ili pogreška prikazat će se u području **Terminal output**.
8. Gumb **Otvori postojeću .py datoteku** učitava postojeću Python datoteku u editor.
9. Gumb **Spremi datoteku** sprema trenutačni sadržaj editora kao `.py` datoteku.

## Saving files

Web preglednik iz sigurnosnih razloga najčešće ne dopušta web stranici da sama spremi datoteku izravno u istu mapu u kojoj se nalazi `index.html`.

Zato postoje dvije mogućnosti:

1. Ako preglednik podržava odabir mape, nakon pritiska na **Spremi datoteku** odaberite mapu u kojoj se nalazi ovaj editor. Editor će pokušati stvoriti podmapu `programi` i spremiti `.py` datoteku u nju.
2. Ako preglednik ne podržava izravno spremanje u mapu, datoteka će se spremiti kao preuzimanje. Tada je ručno premjestite u istu mapu u kojoj je `pokreni_py_datoteku.bat` ili u podmapu `programi`.

## Dodatno pokretanje `.py` datoteke u Windows terminalu

Datoteka `pokreni_py_datoteku.bat` služi za stvarno terminalski pokretanje Python datoteka na Windows računalu. To je preporučeno za složeniji kod, za programe koji koriste lokalno instalirane Python pakete i za nastavu u kojoj učenik treba vidjeti stvarno ponašanje terminala.

Upotreba:

1. Spremite ili kopirajte jednu ili više `.py` datoteka u istu mapu u kojoj je `pokreni_py_datoteku.bat` ili u podmapu `programi`.
2. Pokrenite `pokreni_py_datoteku.bat`.
3. Ako je pronađena samo jedna `.py` datoteka, pokrenut će se odmah.
4. Ako ih je više, prikazat će se numerirani popis i tražit će se odabir broja.
5. Prozor terminala ostaje otvoren nakon završetka programa, tako da se može pročitati rezultat ili pogreška.

Pokretač najprije pokušava koristiti `py -3`, a ako nije dostupan, pokušava koristiti `python`. Ako Python nije instaliran ili nije dodan u PATH, prikazat će poruku o pogrešci.

## Brojač redaka i pristupačno snalaženje

Editor ima vizualni brojač redaka unutar okvira polja za kod. Na početku je prikazan broj 1. Kada korisnik pritisne Enter i prijeđe u novi redak, dodaje se broj 2 i tako redom. Brojevi su prikazani u posebnom vizualnom sloju i nisu dio sadržaja textarea polja, pa se ne spremaju u `.py` datoteku.

Budući da čitači ekrana ne čitaju pouzdano vizualni sloj s brojevima redaka dok se korisnik kreće po običnom višerednom polju, dodana je posebna pristupačna logika:

- pri običnom pisanju i čitanju koda strelicama ne izgovaraju se redak i stupac;
- nakon pritiska na Enter izgovara se trenutačni redak i stupac preko jednog statusnog elementa;
- gumb **Izgovori položaj** izgovara samo broj retka i stupac;
- prečac **Alt+L** radi isto dok je fokus u polju **Python kod**;
- polje **Idi na redak** omogućuje upis broja retka i brzo premještanje na taj redak.

Čitači ekrana i dalje koriste obično višeredno tekstualno polje, tako da je uređivanje dostupno tipkovnicom i strelicama, a brojevi redaka se ne spremaju u Python datoteku.

## Rad s `input()`

Ako program koristi `input()`, preglednik će otvoriti dijaloški okvir za unos vrijednosti. Unesena vrijednost ispisuje se u terminalski ispis kako bi učenik mogao pratiti tijek izvođenja.

Za potpuno stvarno terminalsko iskustvo, spremite `.py` datoteku u istu mapu ili podmapu `programi` i pokrenite `pokreni_py_datoteku.bat`.

## Limitations

- Pyodide se učitava s interneta, pa je za prvo pokretanje u pregledniku potrebna internetska veza.
- Gumb **Run code** izvršava kod u pregledniku, ne u instaliranom Pythonu na računalu.
- `pokreni_py_datoteku.bat` radi samo na Windowsu i zahtijeva instaliran Python.
- Preglednik možda neće dopustiti automatsko spremanje u mapu bez korisničkog odabira.
- Neki vanjski Python paketi nisu dostupni bez dodatnog učitavanja u Pyodide.
