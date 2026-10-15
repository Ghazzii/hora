import type { Governorate } from "@/lib/constants";

/**
 * Délégations of each governorate, offered as the "Ville" choices at checkout.
 * Customers whose locality isn't listed pick "Autre ville" and type it, so the list never blocks an order.
 */
export const TUNISIAN_CITIES: Record<Governorate, readonly string[]> = {
  Ariana: ["Ariana Ville", "Ettadhamen", "Kalâat el-Andalous", "La Soukra", "Mnihla", "Raoued", "Sidi Thabet"],
  "Béja": ["Amdoun", "Béja Nord", "Béja Sud", "Goubellat", "Medjez el-Bab", "Nefza", "Téboursouk", "Testour", "Thibar"],
  "Ben Arous": ["Ben Arous", "Bou Mhel el-Bassatine", "El Mourouj", "Ezzahra", "Fouchana", "Hammam Chott", "Hammam Lif", "Médina Jedida", "Mégrine", "Mohamedia", "Mornag", "Radès"],
  Bizerte: ["Bizerte Nord", "Bizerte Sud", "El Alia", "Ghar El Melh", "Ghezala", "Joumine", "Mateur", "Menzel Bourguiba", "Menzel Jemil", "Ras Jebel", "Sejnane", "Tinja", "Utique", "Zarzouna"],
  "Gabès": ["El Hamma", "El Metouia", "Gabès Médina", "Gabès Ouest", "Gabès Sud", "Ghannouch", "Mareth", "Matmata", "Menzel El Habib", "Nouvelle Matmata"],
  Gafsa: ["Belkhir", "El Guettar", "El Ksar", "Gafsa Nord", "Gafsa Sud", "Mdhilla", "Métlaoui", "Moularès", "Redeyef", "Sened", "Sidi Aïch"],
  Jendouba: ["Aïn Draham", "Balta-Bou Aouane", "Bou Salem", "Fernana", "Ghardimaou", "Jendouba", "Jendouba Nord", "Oued Meliz", "Tabarka"],
  Kairouan: ["Aïn Djeloula", "Bou Hajla", "Chebika", "Echrarda", "El Alâa", "Haffouz", "Hajeb El Ayoun", "Kairouan Nord", "Kairouan Sud", "Menzel Mehiri", "Nasrallah", "Oueslatia", "Sbikha"],
  Kasserine: ["El Ayoun", "Ezzouhour", "Fériana", "Foussana", "Haïdra", "Hassi El Ferid", "Jedelienne", "Kasserine Nord", "Kasserine Sud", "Majel Bel Abbès", "Sbeïtla", "Sbiba", "Thala"],
  "Kébili": ["Douz Nord", "Douz Sud", "Faouar", "Kébili Nord", "Kébili Sud", "Souk Lahad"],
  "Le Kef": ["Dahmani", "Djerissa", "El Ksour", "Kalâat Khasba", "Kalâat Senan", "Le Kef Est", "Le Kef Ouest", "Le Sers", "Nebeur", "Sakiet Sidi Youssef", "Tajerouine"],
  Mahdia: ["Bou Merdes", "Chebba", "Chorbane", "El Djem", "Essouassi", "Hebira", "Ksour Essef", "Mahdia", "Melloulèche", "Ouled Chamekh", "Sidi Alouane"],
  "La Manouba": ["Borj El Amri", "Djedeida", "Douar Hicher", "El Battan", "La Manouba", "Mornaguia", "Oued Ellil", "Tebourba"],
  "Médenine": ["Ben Gardane", "Beni Khedache", "Djerba Ajim", "Djerba Houmt Souk", "Djerba Midoun", "Médenine Nord", "Médenine Sud", "Sidi Makhlouf", "Zarzis"],
  Monastir: ["Bekalta", "Bembla", "Beni Hassen", "Jemmal", "Ksar Hellal", "Ksibet el-Médiouni", "Moknine", "Monastir", "Ouerdanine", "Sahline", "Sayada-Lamta-Bou Hajar", "Téboulba", "Zéramdine"],
  Nabeul: ["Béni Khalled", "Béni Khiar", "Bou Argoub", "Dar Chaâbane El Fehri", "El Haouaria", "El Mida", "Grombalia", "Hammam Ghezèze", "Hammamet", "Kélibia", "Korba", "Menzel Bouzelfa", "Menzel Temime", "Nabeul", "Soliman", "Takelsa"],
  Sfax: ["Agareb", "Bir Ali Ben Khalifa", "El Amra", "El Hencha", "Ghraïba", "Jebiniana", "Kerkennah", "Mahrès", "Menzel Chaker", "Sakiet Eddaïer", "Sakiet Ezzit", "Sfax Ouest", "Sfax Sud", "Sfax Ville", "Skhira", "Thyna"],
  "Sidi Bouzid": ["Bir El Hafey", "Cebbala Ouled Asker", "Jilma", "Meknassy", "Menzel Bouzaiane", "Mezzouna", "Ouled Haffouz", "Regueb", "Sidi Ali Ben Aoun", "Sidi Bouzid Est", "Sidi Bouzid Ouest", "Souk Jedid"],
  Siliana: ["Bargou", "Bou Arada", "El Aroussa", "El Krib", "Gaâfour", "Kesra", "Makthar", "Rouhia", "Sidi Bou Rouis", "Siliana Nord", "Siliana Sud"],
  Sousse: ["Akouda", "Bouficha", "Enfidha", "Hammam Sousse", "Hergla", "Kalâa Kebira", "Kalâa Seghira", "Kondar", "M'saken", "Sidi Bou Ali", "Sidi El Héni", "Sousse Jawhara", "Sousse Médina", "Sousse Riadh", "Sousse Sidi Abdelhamid", "Zaouiet Ksibet Thrayet"],
  Tataouine: ["Bir Lahmar", "Dehiba", "Ghomrassen", "Remada", "Smâr", "Tataouine Nord", "Tataouine Sud"],
  Tozeur: ["Degache", "Hazoua", "Nefta", "Tameghza", "Tozeur"],
  Tunis: ["Bab El Bhar", "Bab Souika", "Carthage", "Cité El Khadra", "Djebel Jelloud", "El Kabaria", "El Menzah", "El Omrane", "El Omrane Supérieur", "El Ouardia", "Ettahrir", "Ezzouhour", "Hraïria", "La Goulette", "La Marsa", "Le Bardo", "Le Kram", "Médina", "Séjoumi", "Sidi El Béchir", "Sidi Hassine"],
  Zaghouan: ["Bir Mcherga", "El Fahs", "Nadhour", "Saouaf", "Zaghouan", "Zriba"],
};

export function citiesOf(governorate: string): readonly string[] {
  return TUNISIAN_CITIES[governorate as Governorate] ?? [];
}
