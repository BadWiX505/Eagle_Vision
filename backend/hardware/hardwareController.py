import serial
import serial.tools.list_ports
import time

class HardwareController:
    """
    Couche d'abstraction matérielle (Hardware Abstraction Layer) pour EAGLE AI VISION.
    
    Architecture : "Smart Brain, Dumb Slave".
    Ce script (le Cerveau) gère toute la logique mathématique, garde en mémoire l'état 
    actuel du système, et envoie des commandes absolues à l'Arduino (l'Esclave).
    """

    def __init__(self, port='auto', baudrate=115200):
        """
        Initialise la connexion Série avec détection automatique du port.
        """
        target_port = port
        
        # 1. Gestion de la Détection Automatique (Plug & Play)
        if target_port.lower() == 'auto':
            target_port = self._find_arduino_port()
            if not target_port:
                print("ERREUR : Impossible de détecter automatiquement l'Arduino.")
                self._print_available_ports()
                self.serial = None
                return

        # 2. Établissement de la Connexion Série
        try:
            # timeout=0.1 permet de ne pas bloquer le script si l'Arduino ne répond pas
            self.serial = serial.Serial(target_port, baudrate, timeout=0.1)
            
            # CRITIQUE : L'ouverture du port Série provoque un redémarrage physique de l'Arduino.
            # On doit obligatoirement attendre 2 secondes avant d'envoyer la première commande.
            time.sleep(2)  
            print(f"Hardware Controller connecté avec succès sur {target_port}")
        except Exception as e:
            print(f"Échec de la connexion au matériel sur {target_port} : {e}")
            self.serial = None
            self._print_available_ports()
            return

        # 3. Le "Single Source of Truth" (Source Unique de Vérité)
        # C'est ici que l'on stocke l'état réel de la caméra. L'Arduino ne calcule rien.
        self.current_pan = 90
        self.current_tilt = 110

        # Limites Physiques du Matériel (Sécurité pour ne pas forcer les servos)
        self.PAN_MIN, self.PAN_MAX = 1, 179
        self.TILT_MIN, self.TILT_MAX = 50, 170

        # Initialisation : On force la caméra à se centrer au démarrage
        self.MoveCameraDefault()

    def _find_arduino_port(self):
        """
        Scanne tous les ports USB de l'ordinateur à la recherche de la puce de l'Arduino.
        Fonctionne sur Windows (COMx) et Linux/Raspberry (/dev/ttyUSBx).
        """
        print("Recherche de l'Arduino en cours...")
        ports = serial.tools.list_ports.comports()
        for p in ports:
            # Cherche les identifiants classiques des Arduino originaux ou des clones chinois
            if any(keyword in p.description for keyword in ['Arduino', 'CH340', 'USB Serial', 'CP210']):
                print(f"Arduino détecté automatiquement sur {p.device} ({p.description})")
                return p.device
        return None

    def _print_available_ports(self):
        """
        Fonction d'aide qui liste tous les périphériques USB branchés si la détection échoue.
        Très utile pour le débogage sur scène.
        """
        ports = serial.tools.list_ports.comports()
        print("\n--- Ports USB Disponibles ---")
        if not ports:
            print("Aucun périphérique Série USB trouvé. L'Arduino est-il branché ?")
        for p in ports:
            print(f"- {p.device}: {p.description}")
        print("---------------------------\n")

    def _send_command(self, cmd_string):
        """
        Méthode interne (privée) pour envoyer les chaînes de caractères à l'Arduino.
        Protocole "Fire-and-Forget" (Auto-guérison) pour ne pas ralentir le traitement vidéo.
        """
        if self.serial:
            # Le caractère '\n' (retour à la ligne) est vital : il indique à l'Arduino 
            # que le message est terminé et qu'il peut l'exécuter.
            self.serial.write(f"{cmd_string}\n".encode('utf-8'))

    # ==========================================
    # --- COMMANDES DE LA CAMÉRA (PAN/TILT) ---
    # ==========================================

    def MoveCameraX(self, degree):
        """
        Déplace la caméra sur l'axe Horizontal (Pan) de manière RELATIVE.
        Exemple : MoveCameraX(5) tourne à droite de 5 degrés depuis la position actuelle.
        """
        new_pan = self.current_pan + degree
        
        # Sécurité : On "clamp" (limite) la valeur mathématique pour ne jamais 
        # envoyer d'angle hors des limites mécaniques à l'Arduino.
        self.current_pan = max(self.PAN_MIN, min(self.PAN_MAX, new_pan))
        
        # On envoie la commande ABSOLUE (ex: "X105")
        self._send_command(f"X{int(self.current_pan)}")

    def MoveCameraY(self, degree):
        """
        Déplace la caméra sur l'axe Vertical (Tilt) de manière RELATIVE.
        Exemple : MoveCameraY(-10) baisse la caméra de 10 degrés.
        """
        new_tilt = self.current_tilt + degree
        self.current_tilt = max(self.TILT_MIN, min(self.TILT_MAX, new_tilt))
        self._send_command(f"Y{int(self.current_tilt)}")

    def MoveCameraDefault(self):
        """
        Réinitialise la caméra exactement au centre (Point Zéro).
        """
        self.current_pan = 90
        self.current_tilt = 110
        self._send_command(f"X{self.current_pan}")
        self._send_command(f"Y{self.current_tilt}")

    # =======================================
    # --- COMMANDES DU CHARIOT (LE RAIL) ---
    # =======================================

    def setRailDirection(self, direction):
        """
        Définit la direction du prochain mouvement du chariot. 
        NE DÉMARRE PAS le moteur, prépare juste la direction (ex: inversion de patrouille).
        """
        direction = direction.lower()
        if direction in ['forward', 'right']:
            self._send_command("D1") # D1 = Direction Droite/Avant
        elif direction in ['backward', 'left']:
            self._send_command("D0") # D0 = Direction Gauche/Arrière
        else:
            print("Direction invalide. Utilisez 'forward' (droite) ou 'backward' (gauche).")

    def StartRail(self):
        """
        Lance le mouvement continu du chariot dans la direction préalablement définie.
        Le chariot continuera jusqu'à recevoir StopRail() ou toucher un fin de course.
        """
        self._send_command("M1") # M1 = Motion Active

    def StopRail(self):
        """
        Stoppe immédiatement le chariot. L'Arduino gérera la rampe de décélération 
        pour un arrêt fluide sans perte de pas.
        """
        self._send_command("M0") # M0 = Motion Inactive

    def close(self):
        """
        Ferme proprement la connexion. À appeler lors de l'arrêt de l'application
        pour éviter de laisser les moteurs tourner en arrière-plan.
        """
        self.StopRail() # Arrêt d'urgence mécanique
        if self.serial:
            self.serial.close()
    
    # --- MODE CONTROLS ---

    def setModeAuto(self):
        """
        Sets the Arduino to AUTO mode.
        If the rail hits a limit switch, it will automatically reverse direction.
        """
        self._send_command("A1")

    def setModeManual(self):
        """
        Sets the Arduino to MANUAL mode.
        If the rail hits a limit switch, it stops dead and waits for a new StartRail command.
        """
        self._send_command("A0")